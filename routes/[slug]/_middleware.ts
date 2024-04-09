import type { MiddlewareHandler } from "$fresh/server.ts";

import db from "../../utils/db/mod.ts";

import type { RootState } from "../_middleware.ts";
import type { Form } from "../../utils/db/mod.ts";
import type { User } from "../../utils/discord/user.ts";
import type { FormSpec } from "../../utils/form/types.ts";

export type FormState = RootState & {
  form: Form<FormSpec>;
  user?: User;
};

const form: MiddlewareHandler<FormState> = async (_req, ctx) => {
  const form = await db.forms.findOne({}, {
    where: (form, { eq }) => eq(form.slug, ctx.params.slug),
  });
  if (!form || !form.active) return ctx.renderNotFound();
  ctx.state.form = form;
  return await ctx.next();
};

const user: MiddlewareHandler<FormState> = async (_req, ctx) => {
  if (ctx.state.userPromise) {
    const user = await ctx.state.userPromise();
    if (user instanceof Response) return user;
    ctx.state.user = user;
  }

  return await ctx.next();
};

export const handler: MiddlewareHandler<FormState>[] = [form, user];
