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
    presetTypography(),
  ],
  theme: {
    boxShadow: {
      "box": "-0.5px -0.5px 0 0.5px #7e7e7e, 0 0 0 1px #dedede",
      "cell": "inset -1px -1px #dedede, inset 1px 1px #7e7e7e",
      "debossed":
        "inset -1px -1px white, inset 1px 1px #7e7e7e, inset -2px -2px #dedede, inset 2px 2px black",
      "embossed":
        "inset -1px -1px black, inset 1px 1px white, inset -2px -2px #7e7e7e, inset 2px 2px #dedede",
    },
    colors: {
      "browser-blue": "blue",
      "browser-purple": "purple",
      "input-border": "#bdbdbd",
    },
    gridTemplateColumn: {
      "form": "auto auto auto",
    },
    fontFamily: {
      times: ['"Times New Roman"', "Times", "ui-serif", "serif"],
    },
    transitionProperty: {
      "border-color": "border-color",
    },
  },
} satisfies UserConfig;
