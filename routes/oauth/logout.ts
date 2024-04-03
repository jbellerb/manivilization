import { deleteCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import { deleteSession } from "../../utils/session.ts";

import type { RootState as State } from "../_middleware.ts";

export const handler: Handlers<void, State> = {
  async GET(req, ctx) {
    const { searchParams } = new URL(req.url);
    const redirectUrl = searchParams.get("redirect") ?? "/";

    const headers = new Headers({ Location: redirectUrl });
    const response = new Response(null, { status: STATUS_CODE.Found, headers });

    if (!ctx.state.sessionToken) return response;

    await deleteSession(ctx.state.client, ctx.state.sessionToken);
    deleteCookie(response.headers, "__Host-session");

    return response;
  },
};
