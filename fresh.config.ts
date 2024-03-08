import { defineConfig } from "$fresh/server.ts";

import unocss from "./plugins/unocss.ts";

export default defineConfig({
  plugins: [
    unocss({
      generatedFile: "styles.css",
    }),
  ],
});
