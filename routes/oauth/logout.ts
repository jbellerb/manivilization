import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers } from "$fresh/server.ts";

import { db } from "../../utils/db.ts";
import { deleteSession } from "../../utils/session.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    const { searchParams } = new URL(req.url);
    const redirectUrl = searchParams.get("redirect") ?? "/";

    const headers = new Headers({ Location: redirectUrl });
    const response = new Response(null, { status: STATUS_CODE.Found, headers });

    const sessionId = getCookies(req.headers)["__Host-session"];
    if (!sessionId) return response;

    const client = await db.connect();
    await deleteSession(client, sessionId);
    client.end();

    deleteCookie(response.headers, "__Host-session");
    return response;
  },
};
