import {
  Cookie,
  deleteCookie,
  getCookies,
  setCookie,
} from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers } from "$fresh/server.ts";

import { RootState } from "../_middleware.ts";
import { oauthClient } from "../../utils/oauth.ts";
import { createSession, popAuthSession } from "../../utils/session.ts";

// expire sessions after 90 days
const SESSION_EXPIRE = 90 * 24 * 60 * 60;

export const handler: Handlers<void, RootState> = {
  async GET(req, ctx) {
    const authSessionId = getCookies(req.headers)["__Host-oauth-session"];
    if (!authSessionId) throw new Error("missing session cookie");

    const authSession = await popAuthSession(ctx.state.client, authSessionId);

    const tokens = await oauthClient.code.getToken(req.url, {
      state: authSession.state,
      codeVerifier: authSession.verifier,
    });

    const session = {
      id: crypto.randomUUID(),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires: new Date(Date.now() + SESSION_EXPIRE * 1000),
      access_expires: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined,
    };
    await createSession(ctx.state.client, session);

    const headers = new Headers({ Location: authSession.redirect });
    deleteCookie(headers, "__Host-oauth-session");
    const sessionCookie: Cookie = {
      name: "__Host-session",
      value: session.id,
      maxAge: SESSION_EXPIRE,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    };
    setCookie(headers, sessionCookie);

    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
