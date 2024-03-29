import { deleteCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { FreshContext } from "$fresh/server.ts";

import { getRoles } from "../../utils/discord/guild.ts";
import { getUser } from "../../utils/discord/user.ts";
import {
  BadSessionError,
  ExpiredSessionError,
  getSession,
} from "../../utils/session.ts";

import type { RootState } from "../_middleware.ts";
import type { User } from "../../utils/discord/user.ts";

const ADMIN_ROLE = Deno.env.get("DISCORD_ADMIN_ROLE") as string;
if (!ADMIN_ROLE) {
  throw new Error("DISCORD_ADMIN_ROLE is not set for Discord authentication");
}

export type AdminState = RootState & {
  user: User;
  roles: string[];
};

export async function handler(req: Request, ctx: FreshContext<AdminState>) {
  if (ctx.state.sessionToken) {
    try {
      const session = await getSession(
        ctx.state.client,
        ctx.state.sessionToken,
      );
      ctx.state.user = await getUser(session.access_token);
      ctx.state.roles = await getRoles(ctx.state.user.id);

      if (ctx.state.roles.includes(ADMIN_ROLE)) {
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
