{ fetchFromGitHub, mkDenoDerivation, deno, esbuild }:

args:
  let
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

  in mkDenoDerivation (args // {
    outputs = [ "out" "cache" ];
    denoCacheDir = "$cache";

    preBuild = ''
      export ESBUILD_BINARY_PATH=${esbuild19}/bin/esbuild
    '';
    buildPhaseCommand = "${deno}/bin/deno run -A --no-remote dev.ts build";

    installPhaseCommand = ''
      cp -r . "$out"

      # TODO: report Fresh bug where built static files are ignored if there
      # is no static directory in the base directory.
      mkdir -p "$out/static"
    '';
  })
