import { setCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { Cookie } from "$std/http/cookie.ts";
import type { Handlers } from "$fresh/server.ts";

import { oauthClient } from "../../utils/oauth.ts";
import { createAuthSession } from "../../utils/session.ts";

import type { RootState as State } from "../_middleware.ts";

// expire auth sessions after 10 minutes
const AUTH_EXPIRE = 10 * 60;

export const handler: Handlers<void, State> = {
  async GET(req, ctx) {
    const { searchParams } = new URL(req.url);

    const state = crypto.randomUUID();
    const { uri, codeVerifier } = await oauthClient.code.getAuthorizationUri({
      state,
    });

    const authSession = {
      id: crypto.randomUUID(),
      state,
      verifier: codeVerifier,
      redirect: searchParams.get("redirect") ?? "/",
      expires: new Date(Date.now() + AUTH_EXPIRE * 1000),
    };
    await createAuthSession(ctx.state.client, authSession);

    const headers = new Headers({ Location: uri.toString() });
    const authSessionCookie = {
      name: "__Host-oauth-session",
      value: authSession.id,
      maxAge: AUTH_EXPIRE,
      httpOnly: true,
      sameSite: "Lax",
    } satisfies Cookie;
    setCookie(headers, authSessionCookie);

    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
