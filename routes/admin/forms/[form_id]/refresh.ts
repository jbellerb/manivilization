import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import db from "../../../../utils/db/mod.ts";
import { assignRole } from "../../../../utils/discord/guild.ts";
import { toSnowflake } from "../../../../utils/discord/snowflake.ts";

import type { AdminFormState as State } from "./_middleware.ts";
import { getMember } from "../../../../utils/discord/guild.ts";
import { toUsername } from "../../../../utils/discord/user.ts";

export const handler: Handlers<void, State> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    const user = formData.get("user");

    if (!user || typeof user !== "string") {
      return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
    }

    const response = await db.responses.findOne({}, {
      where: (response, { and, eq }) =>
        and(
          eq(response.form, ctx.state.form.id),
          eq(response.discordId, toSnowflake(user)),
        ),
      orderBy: (response, { desc }) => desc(response.date),
    });
    const member = await getMember(
      ctx.state.instance.guildId,
      toSnowflake(user),
    );

    if (response && member.user) {
      response.discordName = toUsername(member.user);
      if (!response.rolesSet) {
        response.rolesSet = true;
        const neededRoles = new Set<bigint>();

        if (ctx.state.form.submitterRole) {
          neededRoles.add(ctx.state.form.submitterRole);
        }
        for (const question of ctx.state.form.questions?._ ?? []) {
          if (question.type === "checkbox_roles") {
            const roles = response.response?.[question.name]?.split(", ");
            for (const { label, role } of question.options) {
              if (roles?.includes(label)) neededRoles.add(toSnowflake(role));
            }
          }
        }

        try {
          await Promise.all(
            Array.from(neededRoles).map((role) =>
              assignRole(ctx.state.instance.guildId, response.discordId, role)
            ),
          );
        } catch (e) {
          response.rolesSet = false;
          throw e;
        }
      }

      await db.responses.update(response);
    }

    return new Response(null, {
      status: STATUS_CODE.SeeOther,
      headers: { Location: `/admin/forms/${ctx.state.form.id}/results` },
    });
  },
};
