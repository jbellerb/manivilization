import { deleteCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import db from "../../utils/db/mod.ts";

import type { RootState as State } from "../_middleware.ts";

export const handler: Handlers<void, State> = {
  async GET(req, ctx) {
    const { searchParams } = new URL(req.url);
    const redirectUrl = searchParams.get("redirect") ?? "/";

    const response = new Response(null, {
      status: STATUS_CODE.Found,
      headers: { Location: redirectUrl },
    });

    if (ctx.state.sessionToken) {
      const tokenId = ctx.state.sessionToken;
      await db.authSessions
        .delete((authSession, { eq }) => eq(authSession.id, tokenId));
      deleteCookie(response.headers, "__Host-session");
    }

    return response;
  },
};
