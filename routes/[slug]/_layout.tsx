import { Head } from "$fresh/runtime.ts";
import { defineLayout } from "$fresh/server.ts";
// @deno-types="https://esm.sh/v135/@types/commonmark@0.27.9/index.d.ts"
import { HtmlRenderer, Parser } from "commonmark";

import type { FormState as State } from "./_middleware.ts";

export default defineLayout<State>((_req, { Component, state }) => {
  let descriptionLine;
  if (state.form.description) {
    descriptionLine = state.form.description;
    const split = state.form.description.search(/[\n\r]/);
    if (split !== -1) {
      descriptionLine = state.form.description.slice(0, split) + "...";
    }
  }

  return (
    <>
      <Head>
        <title>{state.form.name} | {state.instance.name}</title>
        <meta property="og:title" content={state.form.name} />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://${state.instance.host}/${state.form.slug}`}
        />
        {descriptionLine != null && (
          <meta property="og:description" content={descriptionLine} />
        )}
      </Head>
      <header class="max-w-xl w-full">
        <h1 class="text-3xl font-bold">{state.form.name}</h1>
        <div
          class="prose prose-invert prose-gray italic"
          dangerouslySetInnerHTML={{
            __html: (new HtmlRenderer()).render(
              (new Parser()).parse(state.form.description ?? ""),
            ),
          }}
        />
      </header>
      <main class="max-w-xl w-full mt-4">
        <Component />
      </main>
      <footer class="max-w-xl w-full mt-16">
        <ul class="flex">
          <li class="ml-auto">
            <a
              class="text-gray-400 hover:text-white focus-visible:text-white focus-visible:outline-none transition-color"
              href="/privacy"
            >
              Privacy
            </a>
          </li>
        </ul>
      </footer>
    </>
  );
});
