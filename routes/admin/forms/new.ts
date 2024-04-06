import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import { createForm } from "../../../utils/form/form.ts";

import type { AdminState as State } from "../_middleware.ts";

export const handler: Handlers<void, State> = {
  async GET(_req, _ctx) {
    const form = {
      id: crypto.randomUUID(),
      name: "Untitled form",
      slug: "",
      active: false,
    };
    await createForm(form);

    const headers = new Headers({ Location: `/admin/forms/${form.id}` });
    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
