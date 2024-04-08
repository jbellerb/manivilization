import { STATUS_CODE } from "$std/http/status.ts";

import type { MiddlewareHandler } from "$fresh/server.ts";

import { DISCORD_ADMIN_ROLE } from "../../utils/env.ts";
import { getRoles } from "../../utils/discord/guild.ts";
import { DiscordHTTPError } from "../../utils/discord/http.ts";

import type { RootState } from "../_middleware.ts";
import type { User } from "../../utils/discord/user.ts";

export type AdminState = RootState & {
  user: User;
  roles: string[];
};

const user: MiddlewareHandler<AdminState> = async (req, ctx) => {
  if (!ctx.state.userPromise) {
    const { pathname } = new URL(req.url);
    return new Response(null, {
      status: STATUS_CODE.Found,
      headers: { Location: `/oauth/login?redirect=${pathname}` },
    });
  }

  const user = await ctx.state.userPromise();
  if (user instanceof Response) return user;
  ctx.state.user = user;

  return await ctx.next();
};

const roles: MiddlewareHandler<AdminState> = async (_req, ctx) => {
  try {
    ctx.state.roles = await getRoles(ctx.state.user.id);
    if (ctx.state.roles.includes(DISCORD_ADMIN_ROLE)) {
      return await ctx.next();
    }
  } catch (e) {
    if (!(e instanceof DiscordHTTPError)) throw e;
  }

  return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
};

export const handler: MiddlewareHandler<AdminState>[] = [user, roles];
