import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import db from "../../../../utils/db/mod.ts";
import {
  getMember,
  getRoles,
  setRoles,
} from "../../../../utils/discord/guild.ts";
import { toSnowflake } from "../../../../utils/discord/snowflake.ts";
import { toUsername } from "../../../../utils/discord/user.ts";
import { updateRoles } from "../../../../utils/form/roles.ts";

import type { AdminFormState as State } from "./_middleware.ts";

export const handler: Handlers<void, State> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const user = formData.get("user");

    if (!user || typeof user !== "string") {
      return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
    }

    const userSnowflake = toSnowflake(user);
    const response = await db.responses.findOne({}, {
      where: (response, { and, eq }) =>
        and(
          eq(response.form, ctx.state.form.id),
          eq(response.discordId, userSnowflake),
        ),
      orderBy: (response, { desc }) => desc(response.date),
    });
    const member = await getMember(ctx.state.instance.guildId, userSnowflake);

    if (response && member.user) {
      response.discordName = toUsername(member.user);

      response.rolesSet = true;
      try {
        const guildRoles = await getRoles(
          ctx.state.instance.guildId,
          userSnowflake,
        );
        await setRoles(
          ctx.state.instance.guildId,
          response.discordId,
          updateRoles(guildRoles, [{
            form: ctx.state.form,
            response: response.response,
          }]),
        );
      } catch (e) {
        response.rolesSet = false;
        throw e;
      }

      await db.responses.update(response);
    }

    return new Response(null, {
      status: STATUS_CODE.SeeOther,
      headers: { Location: `/admin/forms/${ctx.state.form.id}/results` },
    });
  },
};
