import { defineLayout } from "$fresh/server.ts";
import { HtmlRenderer, Parser } from "commonmark";

import type { FormState } from "./_middleware.ts";

export default defineLayout<FormState>((_req, { Component, state }) => {
  return (
    <div class="flex flex-col min-h-screen items-center px-8 py-16 bg-black text-white">
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
    </div>
  );
});
