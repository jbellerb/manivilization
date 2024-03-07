import { STATUS_CODE } from "$std/http/status.ts";
import { FreshContext } from "$fresh/server.ts";

import { State as RootState } from "../_middleware.ts";
import { getRoles } from "../../utils/discord/guild.ts";
import { User } from "../../utils/discord/user.ts";
import getEnvRequired from "../../utils/get_env_required.ts";

const ADMIN_ROLE = getEnvRequired("DISCORD_ADMIN_ROLE");

export type State = {
  ctx: RootState;
  user: User;
};

export async function handler(_req: Request, ctx: FreshContext<State>) {
  ctx.state.ctx = ctx.state as unknown as RootState;
  if (ctx.state.ctx.user) {
    ctx.state.user = { ...ctx.state.ctx.user };
    ctx.state.user.roles = await getRoles(ctx.state.user.id);

    if (ctx.state.user.roles.includes(ADMIN_ROLE)) {
      return await ctx.next();
    }
  }
  return new Response("Unauthorized.", { status: STATUS_CODE.Found });
}
