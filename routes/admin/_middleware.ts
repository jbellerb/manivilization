import { STATUS_CODE } from "$std/http/status.ts";

import type { MiddlewareHandler } from "$fresh/server.ts";

import { memo } from "../../utils/cache.ts";
import { getRoles } from "../../utils/discord/guild.ts";
import { DiscordHTTPError } from "../../utils/discord/http.ts";
import { SUPER_ADMIN } from "../../utils/env.ts";

import type { RootState } from "../_middleware.ts";
import type { User } from "../../utils/discord/user.ts";

const superAdmin = BigInt(SUPER_ADMIN ?? 0);

export type AdminState = RootState & {
  user: User;
  owner: boolean;
  superAdmin: boolean;
};

const user: MiddlewareHandler<AdminState> = async (_req, ctx) => {
  if (!ctx.state.userPromise) {
    return new Response(null, {
      status: STATUS_CODE.Found,
      headers: { Location: `/oauth/login?redirect=${ctx.url.pathname}` },
    });
  }

  const user = await ctx.state.userPromise();
  if (user instanceof Response) return user;
  ctx.state.user = user;

  ctx.state.owner = ctx.state.user.id === ctx.state.instance.owner;
  ctx.state.superAdmin = ctx.state.user.id === superAdmin;

  return await ctx.next();
};

const roles: MiddlewareHandler<AdminState> = async (_req, ctx) => {
  if (ctx.state.superAdmin || ctx.state.owner) return await ctx.next();

  let roles;
  try {
    roles = await memo(
      "roles",
      `${ctx.state.instance.guildId}-${ctx.state.user.id}`,
      () => getRoles(ctx.state.instance.guildId, ctx.state.user.id),
      5 * 60 * 1000,
    );
  } catch (e) {
    if (!(e instanceof DiscordHTTPError)) throw e;
  }

  if (roles && roles.includes(ctx.state.instance.adminRole)) {
    return await ctx.next();
  }

  return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
};

export const handler: MiddlewareHandler<AdminState>[] = [user, roles];
