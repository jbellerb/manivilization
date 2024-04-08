import type { MiddlewareHandler } from "$fresh/server.ts";

import db from "../../../../utils/db/mod.ts";

import type { AdminState } from "../../_middleware.ts";
import type { Form } from "../../../../utils/db/schema.ts";
import type { FormSpec } from "../../../../utils/form/types.ts";

export type AdminFormState = AdminState & {
  form: Form<FormSpec>;
};

const form: MiddlewareHandler<AdminFormState> = async (_req, ctx) => {
  const form = await db.forms.findOne({}, {
    where: (form, { eq }) => eq(form.id, ctx.params.form_id),
  });
  if (!form) return ctx.renderNotFound();
  ctx.state.form = form;
  return await ctx.next();
};

export const handler: MiddlewareHandler<AdminFormState>[] = [form];
