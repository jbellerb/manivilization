import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import db from "../../utils/db/mod.ts";
import { sendMessage } from "../../utils/discord/guild.ts";
import { toSnowflake } from "../../utils/discord/snowflake.ts";

import type { AdminState as State } from "./_middleware.ts";

export const handler: Handlers<void, State> = {
  async POST(req, { state }) {
    if (!state.superAdmin && !state.owner) {
      return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
    }

    const formData = await req.formData();
    const instance = await db.instances.findOne({}, {
      where: (instance, { eq }) => eq(instance.id, state.instance.id),
    });
    if (!instance) throw new Error("Failed to load current instance");

    try {
      const channel = formData.get("channel");
      if (typeof channel !== "string") {
        throw new Error("channel is not a string");
      }
      const label = formData.get("label") || "Refresh roles";
      if (typeof label !== "string") {
        throw new Error("label is not a string");
      }
      const message = formData.get("message");
      if (typeof message !== "string") {
        throw new Error("message is not a string");
      }

      sendMessage(toSnowflake(channel), {
        content: message,
        components: [{
          type: 1,
          components: [{
            type: 2,
            label,
            style: 1,
            custom_id: "refresh_roles",
          }],
        }],
      });

      const headers = new Headers({ Location: "/admin" });
      return new Response(null, { status: STATUS_CODE.Found, headers });
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
      }
      throw e;
    }
  },
};
