import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { MiddlewareHandler } from "$fresh/server.ts";

import { getCache, invalidateCache, memo, setCache } from "../utils/cache.ts";
import db from "../utils/db/mod.ts";
import { DiscordHTTPError } from "../utils/discord/http.ts";
import { getUser } from "../utils/discord/user.ts";
import { refreshSession, SessionRefreshError } from "../utils/session.ts";

import type { Instance, Session } from "../utils/db/mod.ts";
import type { User } from "../utils/discord/user.ts";

export type RootState = {
  instance: Instance;
  sessionToken?: string;
  userPromise?: () => Promise<User | Response>;
};

const instance: MiddlewareHandler<RootState> = async (req, ctx) => {
  const { host } = new URL(req.url);
  try {
    const instance = await db.instances.findOne({}, {
      where: (instance, { eq }) => eq(instance.host, host),
      cache: { key: host, ttl: 5 * 60 * 1000 },
    });

    if (instance) {
      ctx.state.instance = instance;
      return await ctx.next();
    }
  } catch (e) {
    console.error(e);
    return new Response("Internal Server Error", {
      status: STATUS_CODE.InternalServerError,
    });
  }

  return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
};

const auth: MiddlewareHandler<RootState> = async (req, ctx) => {
  if (ctx.destination !== "route") return await ctx.next();

  const token = getCookies(req.headers)["__Host-session"];
  if (token) {
    ctx.state.sessionToken = token;
    ctx.state.userPromise = async () => {
      const cached = getCache("session", token) as Session | undefined;
      const session = cached ||
        await db.sessions.findOne({}, {
          where: (session, { and, eq }) =>
            and(
              eq(session.id, token),
              eq(session.instance, ctx.state.instance.id),
            ),
        });

      if (session && session.expires > new Date()) {
        try {
          if (session.accessExpires && session.accessExpires < new Date()) {
            await refreshSession(session);
          }
          const expires = Math.min(
            session.expires.getTime(),
            session.accessExpires?.getTime() ?? Number.MAX_SAFE_INTEGER,
          );
          const ttl = expires - Date.now();

          if (!cached) setCache("session", token, session, ttl);

          return await memo(
            "user",
            session.accessToken,
            () => getUser(session.accessToken),
            Math.min(60 * 1000, ttl),
          );
        } catch (e) {
          invalidateCache("session", token);
          invalidateCache("user", session.accessToken);
          if (!(e instanceof SessionRefreshError)) {
            if (!(e instanceof DiscordHTTPError)) throw e;
          }
        }
      }

      const { pathname } = new URL(req.url);
      const response = new Response(null, {
        status: STATUS_CODE.Found,
        headers: { Location: `/oauth/login?redirect=${pathname}` },
      });
      if (session) {
        await db.sessions.delete(session);
        deleteCookie(response.headers, "__Host-session");
      }
      return response;
    };
  }

  return await ctx.next();
};

export const handler: MiddlewareHandler<RootState>[] = [instance, auth];
