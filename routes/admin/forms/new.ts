import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers } from "$fresh/server.ts";

import { State } from "../_middleware.ts";
import { createForm } from "../../../utils/form.ts";

export const handler: Handlers<null, State> = {
  async GET(_req, ctx) {
    const form = {
      id: crypto.randomUUID(),
      name: "Untitled form",
      slug: "",
      active: false,
    };
    await createForm(ctx.state.client, form);

    const headers = new Headers({ Location: `/admin/forms/${form.id}` });
    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
