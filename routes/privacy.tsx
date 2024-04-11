import { defineRoute } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
// @deno-types="https://esm.sh/v135/@types/commonmark@0.27.9/index.d.ts"
import { HtmlRenderer, Parser } from "commonmark";

import type { RootState as State } from "./_middleware.ts";

export default defineRoute<State>((_req, { state }) => {
  return (
    <>
      <Head>
        <title>Privacy Policy | {state.instance.name}</title>
      </Head>
      <main>
        <h1 class="text-3xl font-bold">Privacy Policy</h1>
        <article
          class="prose prose-invert prose-gray"
          dangerouslySetInnerHTML={{
            __html: (new HtmlRenderer()).render(
              (new Parser()).parse(state.instance.privacyPolicy ?? ""),
            ),
          }}
        />
      </main>
    </>
  );
});
