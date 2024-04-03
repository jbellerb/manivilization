import { dirname, fromFileUrl, join } from "$std/path/mod.ts";

import type { Preflight, Preset, Rule } from "@unocss/core";

function buildPreflight(
  rules: Record<string, Record<string, string>>,
  extra?: Omit<Preflight, "getCSS">,
): Preflight {
  return {
    getCSS: () =>
      Object.entries(rules).map((rule) => {
        const styles = Object.entries(rule[1])
          .map(([key, value]) => `${key}:${value};`)
          .join("");
        return `${rule[0]}{${styles}}`;
      }).join(""),
    ...extra,
  };
}

function formPreflight(): Preflight {
  return buildPreflight({
    "input:focus-visible, textarea:focus-visible, button:focus-visible, select:focus-visible":
      { outline: "none" },
    "[type='checkbox']": {
      appearance: "none",
      display: "flex",
      color: "inherit",
      "background-color": "#fff",
      width: "1rem",
      height: "1rem",
      border: "2px solid #000",
    },
    "[type='checkbox']::before": {
      content: '""',
      width: "100%",
      height: "100%",
      "background-color": "currentColor",
      // Path taken from Firefox source (https://hg.mozilla.org/mozilla-central/file/tip/widget/Theme.cpp#l544)
      "clip-path":
        "polygon(18% 54%, 39% 79%, 46% 79%, 86% 32%, 84% 21%, 75% 21%, 46% 57%, 39% 59%, 25% 43%)",
      transform: "scale(0)",
      "transform-origin": "center",
    },
    "[type='checkbox']:checked::before": {
      transform: "scale(1)",
    },
    "select": {
      appearance: "none",
      "background-color": "transparent",
      outline: "none",
      border: "none",
      width: "100%",
    },
    ".select-wrapper": {
      display: "grid",
      height: "fit-content",
      "align-items": "center",
    },
    ".select-wrapper > select": {
      "padding-right": "1.125rem",
      "grid-area": "1 / 1 / -1 / -1",
      "z-index": "1",
    },
    ".select-wrapper::after": {
      content: '""',
      width: "1.125rem",
      height: "1.125rem",
      "background-color": "currentColor",
      // Path taken from Firefox source (https://hg.mozilla.org/mozilla-central/file/tip/widget/Theme.cpp#l764)
      "clip-path":
        "polygon(21% 43%, 46% 71%, 54% 71%, 79% 43%, 79% 36%, 71% 36%, 50% 61%, 50% 61%, 29% 36%, 21% 36%)",
      "grid-area": "1 / 1 / -1 / -1",
      "justify-self": "end",
    },
    ".growable": { display: "grid" },
    ".growable::after": {
      content: 'attr(data-value) ""',
      "white-space": "pre-wrap",
      visibility: "hidden",
    },
    ".growable > textarea, .growable::after": {
      "grid-area": "1 / 1 / -1 / -1",
    },
  }, { layer: "forms" });
}

function tailwindPreflight(): Preflight {
  const rootDir = dirname(fromFileUrl(Deno.mainModule));

  return {
    getCSS: async () =>
      await Deno.readTextFile(
        join(rootDir, "utils", "styling", "preflight.css"),
      ),
  };
}

function iconRules(): Rule[] {
  // All paths based on Google's Material Design Icons
  const icons = {
    "arrow-down":
      "polygon(45% 14%, 45% 67%, 21% 43%, 14% 50%, 50% 86%, 86% 50%, 79% 43%, 55% 67%, 55% 14%, 45% 14%)",
    "arrow-up":
      "polygon(45% 86%, 45% 33%, 21% 57%, 14% 50%, 50% 14%, 86% 50%, 79% 57%, 55% 33%, 55% 86%, 45% 86%)",
    "close":
      "polygon(26% 81%, 19% 74%, 43% 50%, 19% 26%, 26% 19%, 50% 43%, 74% 19%, 81% 26%, 57% 50%, 81% 74%, 74% 81%, 50% 57%, 26% 81%)",
    "plus":
      "polygon(45% 55%, 18% 55%, 18% 45%, 45% 45%, 45% 18%, 55% 18%, 55% 45%, 82% 45%, 82% 55%, 55% 55%, 55% 82%, 45% 82%, 45% 55%)",
  };

  return Object.entries(icons).map(([name, path]) => [`i-mdi-${name}`, {
    "background-color": "currentColor",
    color: "inherit",
    "clip-path": path,
  }, { layer: "icons" }]);
}

export function presetStyling(): Preset {
  return {
    // name: "preset-styling",
    name: "unocss-preset-forms",
    preflights: [
      tailwindPreflight(),
      formPreflight(),
    ],
    layers: { forms: -50, icons: -30 },
    rules: [
      ...iconRules(),
    ],
  };
}
