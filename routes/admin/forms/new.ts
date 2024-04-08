import { STATUS_CODE } from "$std/http/status.ts";

import type { Handlers } from "$fresh/server.ts";

import db from "../../../utils/db/mod.ts";
import { Form } from "../../../utils/db/schema.ts";

import type { AdminState as State } from "../_middleware.ts";

export const handler: Handlers<void, State> = {
  async GET(_req, _ctx) {
    const form = new Form(
      "Untitled form",
      "",
      false,
    );
    await db.forms.insert(form);

    const headers = new Headers({ Location: `/admin/forms/${form.id}` });
    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};
