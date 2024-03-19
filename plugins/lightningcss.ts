import * as colors from "$std/fmt/colors.ts";
import { walk, type WalkEntry } from "$std/fs/walk.ts";
import * as path from "$std/path/mod.ts";
import { Plugin, type ResolvedFreshConfig } from "$fresh/server.ts";

import browserslist from "browserslist";
import init, {
  browserslistToTargets,
  transform,
  type TransformOptions,
  type TransformResult,
} from "lightningcss-wasm";

export type LightningCSSPluginOptions = {
  targets?: string | null;
  minify?: boolean;
  errorRecovery?: boolean;
  sourceMap?: boolean;
};

async function findCSSFiles(search: string[]): Promise<Map<string, WalkEntry>> {
  const files = new Map();
  for (const searchPath of search) {
    try {
      const filesIterator = walk(searchPath, {
        exts: ["css"],
        includeDirs: false,
      });
      for await (const file of filesIterator) {
        const relPath = path.relative(searchPath, file.path);
        files.set(relPath, file);
      }
    } catch (e) {
      if (!(e.cause instanceof Deno.errors.NotFound)) throw e;
    }
  }

  return files;
}

function transformCSS(
  options: TransformOptions<Record<string, never>>,
): Pick<TransformResult, "code" | "map"> {
  try {
    const { code, map, warnings } = transform(options);

    for (const warning of warnings) {
      console.log(
        `${
          colors.bold(colors.yellow("warning"))
        }: CSS processing ${warning.type}: ${warning.message}\n    at ${
          colors.cyan(`file://${warning.loc.filename}`)
        }:${colors.yellow(`${warning.loc.line}`)}:${
          colors.yellow(`${warning.loc.column}`)
        }`,
      );
    }

    return { code, map };
  } catch (e) {
    if (e.loc) {
      // Propagate specifically where the CSS error occurred
      if (e.data?.type) e.name = e.data.type;
      e.message += `\n    at ${colors.cyan(`file://${e.fileName}`)}:${
        colors.yellow(`${e.loc.line}`)
      }:${colors.yellow(`${e.loc.column}`)}`;
    }
    throw e;
  }
}

export default function lightningcss(
  options?: LightningCSSPluginOptions,
): Plugin {
  let freshConfig: ResolvedFreshConfig;
  const lightingOptions = {
    targets: options?.targets !== null
      ? browserslistToTargets(browserslist(options?.targets ?? "defaults"))
      : undefined,
    minify: options?.minify ?? true,
    errorRecovery: options?.errorRecovery ?? false,
    sourceMap: options?.sourceMap ?? false,
  };

  return {
    name: "lightningcss",
    buildStart(config) {
      freshConfig = config;
    },
    async buildEnd() {
      if (!freshConfig) {
        throw new Error(
          "buildEnd hook for Lightning CSS plugin called before buildStart",
        );
      }

      const staticDir = freshConfig.staticDir;
      const outStaticDir = path.join(freshConfig.build.outDir, "static");
      const files = await findCSSFiles([staticDir, outStaticDir]);

      // https://github.com/denoland/deno/issues/2552
      await init(
        import.meta.resolve("lightningcss-wasm/lightningcss_node.wasm"),
      );

      for (const [relPath, file] of files) {
        const { code, map } = transformCSS({
          ...lightingOptions,
          filename: path.join(staticDir, relPath),
          code: await Deno.readFile(file.path),
          projectRoot: staticDir,
        });

        const outPath = path.join(outStaticDir, relPath);
        try {
          await Deno.mkdir(path.dirname(outPath), { recursive: true });
        } catch (err) {
          if (!(err instanceof Deno.errors.AlreadyExists)) {
            throw err;
          }
        }

        if (lightingOptions.sourceMap && map) {
          const footer = (new TextEncoder()).encode(
            `/*# sourceMappingURL=${file.name}.map */`,
          );

          const output = new Uint8Array(code.byteLength + footer.byteLength);
          output.set(code, 0);
          output.set(footer, code.byteLength);

          await Deno.writeFile(outPath, output);
          await Deno.writeFile(`${outPath}.map`, map);
        } else {
          await Deno.writeFile(outPath, code);
        }
      }
    },
  };
}
