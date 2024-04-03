import { expandGlob } from "$std/fs/expand_glob.ts";
import * as path from "$std/path/mod.ts";
import { createGenerator } from "@unocss/core";

import type { Plugin, ResolvedFreshConfig } from "$fresh/server.ts";
import type { UnoGenerator, UserConfig } from "@unocss/core";

export type UnoCSSPluginOptions = UserConfig & {
  generatedFile?: string;
};

async function findConfig(rootPath: string): Promise<string> {
  let configPath;
  const candidates = expandGlob("{uno,unocss}.config.{js,ts,mjs,mts}", {
    root: rootPath,
    includeDirs: false,
  });

  for await (const candidate of candidates) {
    if (candidate.isFile) {
      if (!configPath) configPath = candidate.path;
      else {
        throw new Error("Found multiple possible UnoCSS config files.");
      }
    }
  }

  if (!configPath) throw new Error("Could not find UnoCSS config file.");
  return configPath;
}

async function extractAll(
  uno: UnoGenerator,
  searchPath: string,
): Promise<Set<string>> {
  const tokens = new Set<string>();

  for (let code of uno.config.content?.inline ?? []) {
    if (typeof code === "function") code = await Promise.resolve(code());
    const chunk = (typeof code === "string") ? { code } : code;
    uno.applyExtractors(chunk.code, chunk.id, tokens);
  }

  for (const glob of uno.config.content?.filesystem ?? []) {
    for await (const file of expandGlob(glob, { root: searchPath })) {
      if (file.isFile) {
        uno.applyExtractors(
          await Deno.readTextFile(file.path),
          file.path,
          tokens,
        );
      }
    }
  }

  return tokens;
}

async function generateCSS(
  config: ResolvedFreshConfig,
  options?: UserConfig,
): Promise<string> {
  let loadedConfig = {};
  if (options?.configFile !== false) {
    const configPath = options?.configFile ??
      await findConfig(config.basePath);

    const url = path.toFileUrl(configPath).href;
    loadedConfig = (await import(url)).default;
  }

  const uno = createGenerator(loadedConfig, {
    envMode: config.dev ? "dev" : "build",
    ...options,
  });

  // Check if unsupported features are enabled
  [
    [uno.config.transformers, "Transformers are"],
    [uno.config.content?.pipeline, "Extracting from a build pipeline is"],
  ].forEach(([feature, name]) => {
    if (feature) throw new Error(`${name} not supported in Fresh.`);
  });

  const tokens = await extractAll(uno, config.basePath);
  return (await uno.generate(tokens)).css;
}

export default function unocss(options?: UnoCSSPluginOptions): Plugin {
  const routes: Plugin["routes"] = [];
  const generatedFile = options?.generatedFile ?? "uno.css";

  return {
    name: "unocss",
    async configResolved(config) {
      if (config.dev) {
        const css = await generateCSS(config, options);
        const headers = new Headers({ "Content-Type": "text/css" });
        routes.push({
          "path": `/${generatedFile}`,
          handler: (_req, _ctx) => new Response(css, { headers }),
        });
      }
    },
    routes,
    render(ctx) {
      ctx.render();
      return { links: [{ rel: "stylesheet", href: `/${generatedFile}` }] };
    },
    async buildStart(config) {
      const css = await generateCSS(config, options);

      const outPath = path.join(config.build.outDir, "static", generatedFile);
      try {
        await Deno.mkdir(path.dirname(outPath), { recursive: true });
      } catch (err) {
        if (!(err instanceof Deno.errors.AlreadyExists)) {
          throw err;
        }
      }
      await Deno.writeTextFile(outPath, css);
    },
  };
}
