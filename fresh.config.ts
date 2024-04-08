import { defineConfig } from "$fresh/server.ts";

import lightningcss from "./plugins/lightningcss.ts";
import unocss from "./plugins/unocss.ts";
import db from "./utils/db/mod.ts";

const abort = new AbortController();

Deno.addSignalListener("SIGINT", async () => {
  await db.sql.end();
  abort.abort("SIGINT");
});

export default defineConfig({
  signal: abort.signal,
  plugins: [
    unocss({
      generatedFile: "styles.css",
    }),
    lightningcss({
      sourceMap: true,
    }),
  ],
});
