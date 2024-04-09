import presetTypography from "@unocss/preset-typography";
import presetUno from "@unocss/preset-uno";

import type { UserConfig } from "@unocss/core";

import { presetStyling } from "./utils/styling.ts";

export default {
  content: {
    filesystem: ["{routes,islands,components}/**/*.{ts,tsx}"],
  },
  presets: [
    presetStyling(),
    presetUno(),
    presetTypography({ selectorName: "markdown" }),
  ],
  theme: {
    colors: {
      "browser-blue": "blue",
      "browser-purple": "purple",
    },
    fontFamily: {
      times: ['"Times New Roman"', "Times", "ui-serif", "serif"],
    },
    transitionProperty: {
      "border-color": "border-color",
    },
  },
} satisfies UserConfig;
