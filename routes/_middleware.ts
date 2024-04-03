import { getCookies } from "$std/http/cookie.ts";
import { STATUS_CODE } from "$std/http/status.ts";

import type { FreshContext } from "$fresh/server.ts";
import type { PoolClient } from "postgres/client.ts";

import { PUBLIC_URL } from "../utils/env.ts";
import { db } from "../utils/db.ts";

const publicUrl = PUBLIC_URL ? new URL(PUBLIC_URL) : undefined;

export type RootState = {
  client: PoolClient;
  sessionToken?: string;
};

export async function handler(req: Request, ctx: FreshContext<RootState>) {
  const { host } = new URL(req.url);
  if (publicUrl && host !== publicUrl.host) {
    return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
  }
  if (ctx.destination !== "route") return await ctx.next();

  ctx.state.client = await db.connect();
  ctx.state.sessionToken = getCookies(req.headers)["__Host-session"];

  try {
    return await ctx.next();
  } finally {
    ctx.state.client.release();
  }
}
