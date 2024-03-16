import { FreshContext } from "$fresh/server.ts";

import { AdminState } from "../../_middleware.ts";
import { BadFormError, Form, getForm } from "../../../../utils/form.ts";

export type AdminFormState = AdminState & {
  form: Form;
};

export async function handler(
  _req: Request,
  ctx: FreshContext<AdminFormState>,
) {
  try {
    ctx.state.form = await getForm(ctx.state.client, ctx.params.form_id);
    return await ctx.next();
  } catch (e) {
    if (e instanceof BadFormError) return ctx.renderNotFound();
    throw e;
  }
}
