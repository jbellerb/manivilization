import { Cookie, setCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers } from "$fresh/server.ts";

import { db } from "../../utils/db.ts";
import { oauthClient } from "../../utils/oauth.ts";
import { createAuthSession } from "../../utils/session.ts";

// expire auth sessions after 10 minutes
const AUTH_EXPIRE = 10 * 60;

export const handler: Handlers = {
  async GET(req, _ctx) {
    const state = crypto.randomUUID();
    const { uri, codeVerifier } = await oauthClient.code.getAuthorizationUri({
      state,
    });

    const client = await db.connect();
    const { searchParams } = new URL(req.url);
    const authSession = {
      id: crypto.randomUUID(),
      state,
      verifier: codeVerifier,
      redirect: searchParams.get("redirect") ?? "/",
      expires: new Date(Date.now() + AUTH_EXPIRE * 1000),
    };
    await createAuthSession(client, authSession);
    await client.end();

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
