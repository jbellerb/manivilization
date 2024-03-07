import { Cookie, setCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers } from "$fresh/server.ts";

import { State } from "../_middleware.ts";
import { oauthClient } from "../../utils/oauth.ts";
import { createAuthSession } from "../../utils/session.ts";

// expire auth sessions after 10 minutes
const AUTH_EXPIRE = 10 * 60;

export const handler: Handlers<null, State> = {
  async GET(req, ctx) {
    const { searchParams } = new URL(req.url);
    if (ctx.state.sessionId) {
      return new Response(null, {
        status: STATUS_CODE.Found,
        headers: new Headers({
          Location: searchParams.get("redirect") ?? "/",
        }),
      });
    }

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
    const authSessionCookie: Cookie = {
      name: "__Host-oauth-session",
      value: authSession.id,
      maxAge: AUTH_EXPIRE,
      httpOnly: true,
      sameSite: "Lax",
    };
    setCookie(headers, authSessionCookie);

    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
