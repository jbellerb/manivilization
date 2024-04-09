import { setCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { Cookie } from "$std/http/cookie.ts";
import type { Handlers } from "$fresh/server.ts";

import db, { AuthSession } from "../../utils/db/mod.ts";
import { oauthClient } from "../../utils/oauth.ts";

import type { RootState as State } from "../_middleware.ts";

// expire auth sessions after 10 minutes
const AUTH_EXPIRE = 10 * 60;

export const handler: Handlers<void, State> = {
  async GET(req, { state }) {
    const { searchParams, hostname } = new URL(req.url);

    const oauthState = crypto.randomUUID();
    const { uri, codeVerifier } = await oauthClient(
      state.instance.host,
      hostname === "localhost",
    ).code.getAuthorizationUri({ state: oauthState });

    const authSession = new AuthSession(
      state.instance.id,
      oauthState,
      new Date(Date.now() + AUTH_EXPIRE * 1000),
      codeVerifier,
      searchParams.get("redirect") ?? "/",
    );
    await db.authSessions.insert(authSession);

    const response = new Response(null, {
      status: STATUS_CODE.Found,
      headers: { Location: uri.toString() },
    });
    const authSessionCookie = {
      name: "__Host-oauth-session",
      value: authSession.id,
      maxAge: AUTH_EXPIRE,
      httpOnly: true,
      sameSite: "Lax",
    } satisfies Cookie;
    setCookie(response.headers, authSessionCookie);

    return response;
  },
};
