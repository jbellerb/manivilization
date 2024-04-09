import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import db, { Form } from "../../../utils/db/mod.ts";

import type { AdminState as State } from "../_middleware.ts";

export const handler: Handlers<void, State> = {
  async POST(_req, { state }) {
    const form = new Form(
      state.instance.id,
      "Untitled form",
      "",
      false,
    );
    await db.forms.insert(form);

    const headers = new Headers({ Location: `/admin/forms/${form.id}` });
    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
