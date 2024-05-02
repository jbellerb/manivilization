import { decodeHex } from "$std/encoding/hex.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import {
  InteractionResponseType,
  InteractionType,
} from "discord_api_types/payloads/v10/interactions.ts";
import {
  ComponentType,
  MessageFlags,
} from "discord_api_types/payloads/v10/channel.ts";

import type { Handler } from "$fresh/server.ts";
import type {
  APIInteraction,
  APIInteractionGuildMember,
  APIInteractionResponse,
  APIMessageComponentInteraction,
} from "discord_api_types/payloads/v10/interactions.ts";

import db from "../../utils/db/mod.ts";
import { setRoles } from "../../utils/discord/guild.ts";
import { toSnowflake } from "../../utils/discord/snowflake.ts";
import { INTERACTIONS_HOST } from "../../utils/env.ts";
import { updateRoles } from "../../utils/form/roles.ts";

import type { ConstantsState as State } from "../_middleware.ts";
import type { Instance } from "../../utils/db/schema.ts";

const encoder = new TextEncoder();

async function verifySignature(
  req: Request,
  verificationKey: CryptoKey,
): Promise<boolean> {
  const body = await req.clone().arrayBuffer();
  const signature = req.headers.get("X-Signature-Ed25519");
  const timestamp = req.headers.get("X-Signature-Timestamp");
  if (!signature || !timestamp) return false;

  const timestampBytes = encoder.encode(timestamp);
  const payload = new Uint8Array(body.byteLength + timestampBytes.byteLength);
  payload.set(timestampBytes, 0);
  payload.set(new Uint8Array(body), timestampBytes.byteLength);

  return await crypto.subtle
    .verify("Ed25519", verificationKey, decodeHex(signature), payload.buffer);
}

type JSON<T> =
  | number
  | string
  | boolean
  | JSONObject<T>
  | null;
type JSONObject<T> = { [P in keyof T]?: JSON<T[P]> };

async function handleComponentButton(
  customId: string,
  member: JSONObject<APIInteractionGuildMember>,
  instance: Instance,
): Promise<Response | APIInteractionResponse> {
  switch (customId) {
    case ("refresh_roles"): {
      if (typeof member.user !== "object") throw new Error("No user provided");
      if (typeof member.user?.id !== "string") {
        throw new Error("user_id is not a string");
      }
      const userId = toSnowflake(member.user.id);

      if (!Array.isArray(member.roles)) throw new Error("No roles provided");
      const guildRoles = member.roles.map((role) => {
        if (typeof role !== "string") throw new Error("role is not a string");
        return toSnowflake(role);
      });

      const responses = await db.responses.find({
        id: true,
        form: { questions: true, submitterRole: true },
        response: true,
        rolesSet: true,
      }, {
        distinct: "form",
        where: (response, { and, eq }, { form }) =>
          and(
            eq(response.discordId, userId),
            eq(form.instance, instance.id),
          ),
        orderBy: (response, { desc }) => desc(response.date),
      }, { form: true });

      await setRoles(
        instance.guildId,
        userId,
        updateRoles(guildRoles, responses),
      );

      for (const response of responses) {
        if (!response.rolesSet) {
          await db.responses.update({ id: response.id, rolesSet: true });
        }
      }

      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Roles successfully refreshed",
          flags: MessageFlags.Ephemeral,
        },
      };
    }
    default:
      throw new Error("unknown component");
  }
}

async function handleMessageComponent(
  req: JSONObject<APIMessageComponentInteraction>,
  instance: Instance,
): Promise<Response | APIInteractionResponse> {
  if (typeof req.member !== "object" || req.member == null) {
    throw new Error("No member provided");
  }
  const member = req.member;

  if (typeof req.data !== "object" || req.data == null) {
    throw new Error("No data provided");
  }
  if (typeof req.data.custom_id !== "string") {
    throw new Error("component_id is not a string");
  }
  const customId = req.data.custom_id;

  if (typeof req.data.component_type !== "number") {
    throw new Error("component_type is not a number");
  }
  switch (req.data.component_type) {
    case (ComponentType.Button):
      return await handleComponentButton(customId, member, instance);
    default:
      return new Response("Not Implemented", {
        status: STATUS_CODE.NotImplemented,
      });
  }
}

async function handleInteraction(
  req: JSON<APIInteraction>,
): Promise<Response | APIInteractionResponse> {
  if (typeof req !== "object") throw new Error("No interaction provided");
  if (typeof req?.guild_id !== "string") {
    throw new Error("guild_id is not a string");
  }
  const guildId = toSnowflake(req.guild_id);
  const instance = await db.instances.findOne({}, {
    where: (instance, { eq }) => eq(instance.guildId, guildId),
    cache: { key: req.guild_id, ttl: 5 * 60 * 1000 },
  });
  if (!instance) {
    return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
  }

  try {
    switch (req.type) {
      case InteractionType.Ping:
        return { type: InteractionResponseType.Pong };
      case InteractionType.ApplicationCommand:
      case InteractionType.ApplicationCommandAutocomplete:
      case InteractionType.ModalSubmit:
        return new Response("Not Implemented", {
          status: STATUS_CODE.NotImplemented,
        });
      case InteractionType.MessageComponent:
        return await handleMessageComponent(
          req as JSONObject<APIMessageComponentInteraction>,
          instance,
        );
      default:
        throw new Error("Unrecognised interaction type");
    }
  } catch (e) {
    console.warn(e);
    return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
  }
}

export const handler: Handler<void, State> = async (req, ctx) => {
  if (!ctx.state.constants.interactionsVerifyingKey) {
    return ctx.renderNotFound();
  }
  if (!ctx.config.dev && ctx.url.host !== INTERACTIONS_HOST) {
    return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
  }
  if (
    !(await verifySignature(req, ctx.state.constants.interactionsVerifyingKey))
  ) {
    return new Response(null, { status: STATUS_CODE.Unauthorized });
  }
  if (req.method !== "POST") {
    return new Response(null, { status: STATUS_CODE.MethodNotAllowed });
  }

  const response = await handleInteraction(await req.json());
  if (response instanceof Response) return response;
  else return Response.json(response);
};
