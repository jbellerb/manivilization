import { deleteCookie } from "$std/http/cookie.ts";

import type { FreshContext } from "$fresh/server.ts";

import { getUser } from "../../utils/discord/user.ts";
import { BadFormError, getFormBySlug } from "../../utils/form/mod.ts";
import {
  BadSessionError,
  ExpiredSessionError,
  getSession,
} from "../../utils/session.ts";

import type { RootState } from "../_middleware.ts";
import type { User } from "../../utils/discord/user.ts";
import type { Form } from "../../utils/form/types.ts";

export type FormState = RootState & {
  form: Form;
  user?: User;
};

export async function handler(_req: Request, ctx: FreshContext<FormState>) {
  try {
    ctx.state.form = await getFormBySlug(ctx.params.slug);
    if (!ctx.state.form.active) return ctx.renderNotFound();

    if (ctx.state.sessionToken) {
      try {
        const session = await getSession(ctx.state.sessionToken);
        ctx.state.user = await getUser(session.access_token);
      } catch (e) {
        if (
          !(e instanceof BadSessionError || e instanceof ExpiredSessionError)
        ) {
          throw e;
        }
      }
    }

    const res = await ctx.next();
    if (ctx.state.sessionToken && !ctx.state.user) {
      deleteCookie(res.headers, "__Host-session");
    }
    return res;
  } catch (e) {
    if (e instanceof BadFormError) return ctx.renderNotFound();
    throw e;
  }
}
