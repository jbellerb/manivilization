{ lib, stdenvNoCC, fetchFromGitHub, vendorDenoDeps, deno, esbuild }:

{ pname
, version
, src
, postConfigure ? null
, meta ? { }
, denoConfig ? null
, denoLock ? null
}@args:
  let
    denoConfigParsed = builtins.fromJSON (builtins.readFile
      (args.denoConfig or src + "/deno.json"));
    denoLockParsed = builtins.fromJSON (builtins.readFile
      (args.denoLock or src + "/deno.lock"));

    # esbuild binary version must be compatible with what's used by Fresh. as
    # of writing, Fresh uses esbuild 0.19.11.
    esbuild19 = esbuild.overrideAttrs (final: prev: rec {
      version = "0.19.11";
      src = fetchFromGitHub {
        owner = "evanw";
        repo = "esbuild";
        rev = "v${version}";
        hash = "sha256-NUwjzOpHA0Ijuh0E69KXx8YVS5GTnKmob9HepqugbIU=";
      };
    });

    vendoredDeps = vendorDenoDeps {
      denoImports = denoConfigParsed.imports;
      denoLock = denoLockParsed;
    };
    vendoredDenoConfig =
      (builtins.removeAttrs denoConfigParsed [ "imports" "scopes" ]) // {
        importMap = "${vendoredDeps}/import_map.json";
      };

  in stdenvNoCC.mkDerivation {
    inherit pname version src postConfigure meta;

    outputs = [ "out" "cache" ];

    configurePhase = ''
      runHook preConfigure

      export DENO_DIR=$cache
      export ESBUILD_BINARY_PATH=${esbuild19}/bin/esbuild

      cp -r . "$out"
      cat > $out/build_info.json << "EOF"
      ${builtins.toJSON { inherit pname version; }}
      EOF

      # Replace the preexisting Deno config with the one patched to use our
      # vendored dependencies.
      cat > $out/deno.json << "EOF"
      ${builtins.toJSON vendoredDenoConfig}
      EOF

      runHook postConfigure
    '';

    buildPhase = ''
      runHook preBuild

      cd "$out"
      ${deno}/bin/deno run -A --no-remote dev.ts build

      # TODO: report Fresh bug where built static files are ignored if there
      # is no static directory in the base directory.
      mkdir -p "$out/static"

      runHook postBuild
    '';
  }
