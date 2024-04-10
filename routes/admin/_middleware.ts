import { STATUS_CODE } from "$std/http/status.ts";

import type { MiddlewareHandler } from "$fresh/server.ts";

import { memo } from "../../utils/cache.ts";
import { getRoles } from "../../utils/discord/guild.ts";
import { DiscordHTTPError } from "../../utils/discord/http.ts";
import { SUPER_ADMIN } from "../../utils/env.ts";

import type { RootState } from "../_middleware.ts";
import type { User } from "../../utils/discord/user.ts";

const superAdmin = BigInt(SUPER_ADMIN);

export type AdminState = RootState & {
  user: User;
  superAdmin: boolean;
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

  ctx.state.superAdmin = ctx.state.user.id === superAdmin;

  return await ctx.next();
};

const roles: MiddlewareHandler<AdminState> = async (_req, ctx) => {
  try {
    const roles = await memo(
      "roles",
      `${ctx.state.instance.guildId}-${ctx.state.user.id}`,
      () => getRoles(ctx.state.instance.guildId, ctx.state.user.id),
      5 * 60 * 1000,
    );
    if (ctx.state.superAdmin || roles.includes(ctx.state.instance.adminRole)) {
      return await ctx.next();
    }
  } catch (e) {
    if (!(e instanceof DiscordHTTPError)) throw e;
  }

  return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
};

export const handler: MiddlewareHandler<AdminState>[] = [user, roles];
