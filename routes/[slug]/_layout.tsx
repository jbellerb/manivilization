import { Head } from "$fresh/runtime.ts";
import { defineLayout } from "$fresh/server.ts";
// @deno-types="https://esm.sh/v135/@types/commonmark@0.27.9/index.d.ts"
import { HtmlRenderer, Parser } from "commonmark";

import classnames from "../../utils/classnames.ts";

import type { FormState as State } from "./_middleware.ts";
// @deno-types="https://esm.sh/v135/@types/commonmark@0.27.9/index.d.ts"
import type { Node } from "commonmark";

function renderDescription(ast: Node) {
  let descriptionLine = "";
  const walker = ast.walker();

  let event, inParagraph;
  while ((event = walker.next())) {
    const node = event.node;
    if (node.type === "paragraph") {
      if (event.entering) inParagraph = true;
      else break;
    } else if (inParagraph) {
      if (node.type === "linebreak") break;
      else if (node.type === "softbreak") descriptionLine += " ";
      else if (node.type === "text") descriptionLine += node.literal;
    }
  }

  while ((event = walker.next())) {
    if (event.entering) {
      const trailingDot = descriptionLine[descriptionLine.length - 1] === ".";
      descriptionLine += trailingDot ? ".." : "...";
      break;
    }
  }

  return descriptionLine;
}

export default defineLayout<State>((_req, { Component, state }) => {
  const parsed = (new Parser()).parse(state.form.description ?? "");
  const descriptionLine = renderDescription(parsed);

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
        {descriptionLine && (
          <meta property="og:description" content={descriptionLine} />
        )}
      </Head>
      <header class="max-w-xl w-full">
        <h1 class="text-3xl font-bold">{state.form.name}</h1>
        <div
          class="prose prose-invert prose-gray italic"
          dangerouslySetInnerHTML={{
            __html: (new HtmlRenderer()).render(parsed),
          }}
        />
      </header>
      <main
        class={classnames("max-w-xl w-full mt-4", {
          "mb-8": !state.instance.privacyPolicy,
        })}
      >
        <Component />
      </main>
      {state.instance.privacyPolicy && (
        <footer class="max-w-xl w-full mt-auto pt-16 flex">
          <a
            class="ml-auto text-gray-400 hover:text-white focus-visible:text-white focus-visible:outline-none transition-color"
            href="/privacy"
          >
            Privacy
          </a>
        </footer>
      )}
    </>
  );
});
