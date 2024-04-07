import { deleteCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { FreshContext } from "$fresh/server.ts";

import { DISCORD_ADMIN_ROLE } from "../../utils/env.ts";
import { getRoles } from "../../utils/discord/guild.ts";
import { getUser } from "../../utils/discord/user.ts";
import {
  BadSessionError,
  ExpiredSessionError,
  getSession,
} from "../../utils/session.ts";

import type { RootState } from "../_middleware.ts";
import type { User } from "../../utils/discord/user.ts";

export type AdminState = RootState & {
  user: User;
  roles: string[];
};

export async function handler(req: Request, ctx: FreshContext<AdminState>) {
  if (ctx.state.sessionToken) {
    try {
      const session = await getSession(ctx.state.sessionToken);
      ctx.state.user = await getUser(session.accessToken);
      ctx.state.roles = await getRoles(ctx.state.user.id);

      if (ctx.state.roles.includes(DISCORD_ADMIN_ROLE)) {
        return await ctx.next();
      } else {
        return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
      }
    } catch (e) {
      if (!(e instanceof BadSessionError || e instanceof ExpiredSessionError)) {
        throw e;
      }
    }
  }

  const { pathname } = new URL(req.url);
  const headers = new Headers({
    Location: `/oauth/login?redirect=${pathname}`,
  });
  deleteCookie(headers, "__Host-session");
  return new Response(null, { status: STATUS_CODE.Found, headers });
}
