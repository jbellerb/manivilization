import type { UserConfig } from "@unocss/core";
import presetUno from "@unocss/preset-uno";

import { presetForms } from "https://esm.sh/@julr/unocss-preset-forms@0.1.0";

const PREFLIGHT = await (await fetch(
  "https://esm.sh/@unocss/reset@0.58.5/tailwind.css",
)).text();

export default {
  content: {
    filesystem: ["{routes,islands,components}/**/*.{ts,tsx}"],
  },
  presets: [
    presetUno(),
    presetForms({ strategy: "base" }),
  ],
  preflights: [{ getCSS: () => PREFLIGHT }],
  theme: {
    colors: {
      "browser-blue": "blue",
      "browser-purple": "purple",
    },
  },
} satisfies UserConfig;
