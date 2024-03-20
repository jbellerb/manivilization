import { defineLayout } from "$fresh/server.ts";
// @deno-types="https://esm.sh/v135/@types/commonmark@0.27.9/index.d.ts"
import { HtmlRenderer, Parser } from "commonmark";

import type { FormState } from "./_middleware.ts";

export default defineLayout<FormState>((_req, { Component, state }) => {
  return (
    <>
      <header class="max-w-xl w-full">
        <h1 class="pb-1 text-3xl font-bold">
          {state.form.name}
        </h1>
        <div
          class="-mt-1 -mb-4 markdown markdown-invert markdown-gray italic"
          dangerouslySetInnerHTML={{
            __html: (new HtmlRenderer()).render(
              (new Parser()).parse(state.form.description ?? ""),
            ),
          }}
        />
      </header>
      <main class="max-w-xl w-full mt-8">
        <Component />
      </main>
    </>
  );
});
