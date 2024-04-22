import { STATUS_CODE } from "$std/http/status.ts";
import { defineRoute } from "$fresh/server.ts";
// @deno-types="https://esm.sh/v135/@types/commonmark@0.27.9/index.d.ts"
import { HtmlRenderer, Parser } from "commonmark";

import type { Handlers } from "$fresh/server.ts";

import db from "../../utils/db/mod.ts";

import type { FormState as State } from "./_middleware.ts";

export const handler: Handlers<void, State> = {
  async GET(_req, ctx) {
    const responseId = ctx.url.searchParams.get("response");
    if (responseId) {
      const response = await db.responses.findOne({ id: true }, {
        where: (response, { eq }) => eq(response.id, responseId),
      });
      if (response) return ctx.render();
    }

    const headers = new Headers({ Location: `/${ctx.state.form.slug}` });
    return new Response(null, { status: STATUS_CODE.SeeOther, headers });
  },
};

export default defineRoute<State>((_req, { state }) => {
  return (
    <section
      class="-my-4 prose prose-invert prose-gray"
      dangerouslySetInnerHTML={{
        __html: (new HtmlRenderer()).render(
          (new Parser()).parse(state.form.successMessage ?? ""),
        ),
      }}
    />
  );
});
