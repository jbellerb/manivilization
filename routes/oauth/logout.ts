import { deleteCookie } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers } from "$fresh/server.ts";

import { State } from "../_middleware.ts";
import { deleteSession } from "../../utils/session.ts";

export const handler: Handlers<null, State> = {
  async GET(req, ctx) {
    const { searchParams } = new URL(req.url);
    const redirectUrl = searchParams.get("redirect") ?? "/";

    const headers = new Headers({ Location: redirectUrl });
    const response = new Response(null, { status: STATUS_CODE.Found, headers });

    if (!ctx.state.sessionId) return response;

    await deleteSession(ctx.state.client, ctx.state.sessionId);
    deleteCookie(response.headers, "__Host-session");

    return response;
  },
};
