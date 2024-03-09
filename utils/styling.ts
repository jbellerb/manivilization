import { Preflight, Preset } from "@unocss/core";

export function formPreflight(): Preflight {
  const rules = {
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
    ".growable": { display: "grid" },
    ".growable::after": {
      content: 'attr(data-value) ""',
      "white-space": "pre-wrap",
      visibility: "hidden",
    },
    ".growable > textarea, .growable::after": {
      "grid-area": "1 / 1 / -1 / -1",
    },
  };

  return {
    getCSS: () =>
      Object.entries(rules).map(
        (rule: [string, Record<string, string>]) => {
          const styles = Object.entries(rule[1])
            .map(([key, value]) => `${key}:${value};`)
            .join("");
          return `${rule[0]}{${styles}}`;
        },
      ).join(""),
  };
}

export function presetStyling(): Preset {
  return {
    // name: "preset-styling",
    name: "unocss-preset-forms",
    preflights: [
      formPreflight(),
    ],
  };
}
