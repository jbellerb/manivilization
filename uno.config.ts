import type { UserConfig } from "@unocss/core";
import presetUno from "@unocss/preset-uno";

import { presetStyling } from "./utils/styling.ts";

const PREFLIGHT = await (await fetch(
  "https://esm.sh/@unocss/reset@0.58.5/tailwind.css",
)).text();

export default {
  content: {
    filesystem: ["{routes,islands,components}/**/*.{ts,tsx}"],
  },
  presets: [
    presetUno(),
    presetStyling(),
  ],
  preflights: [{ getCSS: () => PREFLIGHT }],
  theme: {
    colors: {
      "browser-blue": "blue",
      "browser-purple": "purple",
    },
    transitionProperty: {
      "border-color": "border-color",
    },
  },
} satisfies UserConfig;
