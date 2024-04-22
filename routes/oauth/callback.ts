import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { Cookie } from "$std/http/cookie.ts";
import type { Handlers } from "$fresh/server.ts";

import db, { Session } from "../../utils/db/mod.ts";
import { oauthClient } from "../../utils/oauth.ts";

import type { RootState as State } from "../_middleware.ts";

// expire sessions after 90 days
const SESSION_EXPIRE = 90 * 24 * 60 * 60;

export const handler: Handlers<void, State> = {
  async GET(req, { config, state, url }) {
    const authSessionCookieName = `${config.dev ? "" : "__Host-"}oauth-session`;
    const sessionCookieName = `${config.dev ? "" : "__Host-"}session`;

    const authSessionId = getCookies(req.headers)[authSessionCookieName];
    if (!authSessionId) throw new Error("missing session cookie");

    const [authSession] = await db.authSessions.delete(
      (authSession, { and, eq }) =>
        and(
          eq(authSession.id, authSessionId),
          eq(authSession.instance, state.instance.id),
        ),
      { id: false },
    );
    if (!authSession || authSession.expires < new Date()) {
      return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
    }

    const tokens = await oauthClient(
      state.instance.host,
      config.dev && url.protocol === "http:",
    ).code.getToken(req.url, {
      state: authSession.state,
      codeVerifier: authSession.verifier,
    });

    const session = new Session(
      state.instance.id,
      new Date(Date.now() + SESSION_EXPIRE * 1000),
      tokens.accessToken,
      tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined,
      tokens.refreshToken,
    );
    await db.sessions.insert(session);

    const response = new Response(null, {
      status: STATUS_CODE.Found,
      headers: { Location: authSession.redirect },
    });
    deleteCookie(response.headers, authSessionCookieName, { path: "/" });
    const sessionCookie = {
      name: sessionCookieName,
      value: session.id,
      maxAge: SESSION_EXPIRE,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    } satisfies Cookie;
    setCookie(response.headers, sessionCookie);

    return response;
  },
};
