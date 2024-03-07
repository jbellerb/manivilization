import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { FreshContext } from "$fresh/server.ts";
import { Client } from "postgres/client.ts";

import { db } from "../utils/db.ts";
import { getUser, type User } from "../utils/discord/user.ts";
import { oauthClient } from "../utils/oauth.ts";
import {
  BadSessionError,
  ExpiredSessionError,
  getSession,
  type Session,
  updateSession,
} from "../utils/session.ts";

export type State = {
  client: Client;
  sessionId?: string;
  accessToken?: string;
  user?: User;
};

function loginRedirect(redirect: string): Response {
  const headers = new Headers({
    Location: `/oauth/login?redirect=${redirect}`,
  });
  deleteCookie(headers, "__Host-session");

  return new Response(null, { status: STATUS_CODE.Found, headers });
}

async function renewToken(client: Client, session: Session): Promise<Session> {
  if (!session.refresh_token) {
    throw new ExpiredSessionError("expired session can't be refreshed");
  }

  const newTokens = await oauthClient.refreshToken.refresh(
    session.refresh_token,
  );
  const newSession = {
    ...session,
    access_token: newTokens.accessToken,
    refresh_token: newTokens.refreshToken ?? session.refresh_token,
    access_expires: newTokens.expiresIn
      ? new Date(Date.now() + newTokens.expiresIn * 1000)
      : undefined,
  };

  await updateSession(client, newSession);
  return newSession;
}

export async function handler(req: Request, ctx: FreshContext<State>) {
  if (ctx.destination !== "route") return await ctx.next();

  ctx.state.client = await db.connect();
  ctx.state.sessionId = getCookies(req.headers)["__Host-session"];

  try {
    const { pathname } = new URL(req.url);
    if (ctx.state.sessionId && !pathname.startsWith("/oauth")) {
      try {
        let session = await getSession(ctx.state.client, ctx.state.sessionId);
        if (
          session.access_expires &&
          session.access_expires < new Date(Date.now() + 2 * 60 * 1000)
        ) {
          // refresh access token first if withing 2 minutes of it expiring
          session = await renewToken(ctx.state.client, session);
        }
        ctx.state.accessToken = session.access_token;
        ctx.state.user = await getUser(ctx.state.accessToken);
      } catch (e) {
        if (e instanceof BadSessionError || e instanceof ExpiredSessionError) {
          return loginRedirect(pathname);
        } else {
          throw e;
        }
      }
    }
    return await ctx.next();
  } finally {
    await ctx.state.client.end();
  }
}
