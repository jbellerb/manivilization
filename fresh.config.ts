import { defineConfig } from "$fresh/server.ts";

import lightningcss from "./plugins/lightningcss.ts";
import unocss from "./plugins/unocss.ts";

export default defineConfig({
  plugins: [
    unocss({
      generatedFile: "styles.css",
    }),
    lightningcss({
      sourceMap: true,
    }),
  ],
});
