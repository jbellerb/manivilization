import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { Cookie } from "$std/http/cookie.ts";
import type { Handlers } from "$fresh/server.ts";

import { Session } from "../../utils/db/schema.ts";
import { oauthClient } from "../../utils/oauth.ts";
import { createSession, popAuthSession } from "../../utils/session.ts";

import type { RootState as State } from "../_middleware.ts";

// expire sessions after 90 days
const SESSION_EXPIRE = 90 * 24 * 60 * 60;

export const handler: Handlers<void, State> = {
  async GET(req, _ctx) {
    const authSessionId = getCookies(req.headers)["__Host-oauth-session"];
    if (!authSessionId) throw new Error("missing session cookie");

    const authSession = await popAuthSession(authSessionId);

    const tokens = await oauthClient.code.getToken(req.url, {
      state: authSession.state,
      codeVerifier: authSession.verifier,
    });

    const session = new Session(
      new Date(Date.now() + SESSION_EXPIRE * 1000),
      tokens.accessToken,
      tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined,
      tokens.refreshToken,
    );
    await createSession(session);

    const headers = new Headers({ Location: authSession.redirect });
    deleteCookie(headers, "__Host-oauth-session");
    const sessionCookie = {
      name: "__Host-session",
      value: session.id,
      maxAge: SESSION_EXPIRE,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    } satisfies Cookie;
    setCookie(headers, sessionCookie);

    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
