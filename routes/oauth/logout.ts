import { deleteCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import db from "../../utils/db/mod.ts";

import type { RootState as State } from "../_middleware.ts";

export const handler: Handlers<void, State> = {
  async GET(req, { config, state }) {
    const sessionCookieName = `${config.dev ? "" : "__Host-"}session`;

    const { searchParams } = new URL(req.url);
    const redirectUrl = searchParams.get("redirect") ?? "/";

    const response = new Response(null, {
      status: STATUS_CODE.Found,
      headers: { Location: redirectUrl },
    });

    if (state.sessionToken) {
      const tokenId = state.sessionToken;
      await db.authSessions
        .delete((authSession, { and, eq }) =>
          and(
            eq(authSession.id, tokenId),
            eq(authSession.instance, state.instance.id),
          )
        );
      deleteCookie(response.headers, sessionCookieName, { path: "/" });
    }

    return response;
  },
};
