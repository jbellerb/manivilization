import { getCookies } from "$std/http/cookie.ts";
import { FreshContext } from "$fresh/server.ts";

import { Client } from "postgres/client.ts";
import { db } from "../utils/db.ts";

export type RootState = {
  client: Client;
  sessionToken?: string;
};

export async function handler(req: Request, ctx: FreshContext<RootState>) {
  if (ctx.destination !== "route") return await ctx.next();

  ctx.state.client = await db.connect();
  ctx.state.sessionToken = getCookies(req.headers)["__Host-session"];

  try {
    return await ctx.next();
  } finally {
    await ctx.state.client.end();
  }
}
