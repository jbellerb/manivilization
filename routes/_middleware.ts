import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { MiddlewareHandler } from "$fresh/server.ts";

import db from "../utils/db/mod.ts";
import { DiscordHTTPError } from "../utils/discord/http.ts";
import { getUser } from "../utils/discord/user.ts";
import { refreshSession } from "../utils/session.ts";
import { PUBLIC_URL } from "../utils/env.ts";

import type { User } from "../utils/discord/user.ts";

const publicUrl = PUBLIC_URL ? new URL(PUBLIC_URL) : undefined;

export type RootState = {
  sessionToken?: string;
  userPromise?: () => Promise<User | Response>;
};

const instance: MiddlewareHandler<RootState> = async (req, ctx) => {
  const { host } = new URL(req.url);
  if (publicUrl && host !== publicUrl.host) {
    return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
  }
  return await ctx.next();
};

const auth: MiddlewareHandler<RootState> = async (req, ctx) => {
  if (ctx.destination !== "route") return await ctx.next();

  const token = getCookies(req.headers)["__Host-session"];
  if (token) {
    ctx.state.sessionToken = token;
    ctx.state.userPromise = async () => {
      const session = await db.sessions.findOne({}, {
        where: (session, { eq }) => eq(session.id, token),
      });

      if (session && session.expires > new Date()) {
        if (
          !session.accessExpires || session.accessExpires > new Date() ||
          await refreshSession(session)
        ) {
          try {
            return await getUser(session.accessToken);
          } catch (e) {
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
