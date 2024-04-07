import type { FreshContext } from "$fresh/server.ts";

import { BadFormError, getForm } from "../../../../utils/form/mod.ts";

import type { AdminState } from "../../_middleware.ts";
import type { Form } from "../../../../utils/db/schema.ts";
import type { FormSpec } from "../../../../utils/form/types.ts";

export type AdminFormState = AdminState & {
  form: Form<FormSpec>;
};

export async function handler(
  _req: Request,
  ctx: FreshContext<AdminFormState>,
) {
  try {
    ctx.state.form = await getForm(ctx.params.form_id);
    return await ctx.next();
  } catch (e) {
    if (e instanceof BadFormError) return ctx.renderNotFound();
    throw e;
  }
}
