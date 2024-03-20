import { STATUS_CODE } from "$std/http/status.ts";
import { defineRoute, Handlers } from "$fresh/server.ts";
// @deno-types="https://esm.sh/v135/@types/commonmark@0.27.9/index.d.ts"
import { HtmlRenderer, Parser } from "commonmark";

import { getResponse } from "../../utils/form/response.ts";

import type { FormState } from "./_middleware.ts";

export const handler: Handlers<void, FormState> = {
  async GET(req, ctx) {
    const { searchParams } = new URL(req.url);
    const responseId = searchParams.get("response");
    if (responseId) {
      if (await getResponse(ctx.state.client, responseId)) {
        return await ctx.render();
      }
    }

    const headers = new Headers({ Location: `/${ctx.state.form.slug}` });
    return new Response(null, { status: STATUS_CODE.SeeOther, headers });
  },
};

export default defineRoute<FormState>((_req, { state }) => {
  return (
    <section
      class="-my-4 markdown markdown-invert markdown-gray"
      dangerouslySetInnerHTML={{
        __html: (new HtmlRenderer()).render(
          (new Parser()).parse(state.form.success_message ?? ""),
        ),
      }}
    />
  );
});
