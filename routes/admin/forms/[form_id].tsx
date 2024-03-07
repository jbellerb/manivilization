import { Handlers, PageProps } from "$fresh/server.ts";

import { State } from "../_middleware.ts";
import { BadFormError, Form, getForm } from "../../../utils/form.ts";

export const handler: Handlers<Form, State> = {
  async GET(_req, ctx) {
    try {
      const form = await getForm(ctx.state.ctx.client, ctx.params.form_id);
      return await ctx.render(form);
    } catch (e) {
      if (e instanceof BadFormError) return ctx.renderNotFound();
      throw e;
    }
  },
};

export default function FormEditor(props: PageProps<Form>) {
  return (
    <>
      <p>{props.data.name}</p>
      <p>{props.data.slug}</p>
      <p>{props.data.active}</p>
      <p>{props.data.description}</p>
      <p>{props.data.questions?.toString()}</p>
      <p>{props.data.success_message}</p>
    </>
  );
}
