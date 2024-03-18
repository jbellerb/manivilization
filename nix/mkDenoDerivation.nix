{ stdenvNoCC, fetchFromGitHub, buildDenoEnv, deno, esbuild }:

{ pname
, version
, src ? null
, denoEnv ? null
, denoConfig ? null
, denoLock ? null
, denoCacheDir ? "$TMPDIR/deno"
, buildPhaseCommand
, installPhaseCommand
, ...
}@args:
  let
    denoEnv = args.denoEnv or (buildDenoEnv {
      inherit src denoConfig denoLock;
    });

  in stdenvNoCC.mkDerivation (args // {
    inherit pname version;
    src = denoEnv;

    configurePhase = args.configurePhase or ''
      runHook preConfigure

      export DENO_DIR="${denoCacheDir}"
      cat > build_info.json << "EOF"
      ${builtins.toJSON { inherit pname version; }}
      EOF

      runHook postConfigure
    '';

    buildPhase = args.buildPhase or ''
      runHook preBuild
      ${buildPhaseCommand}
      runHook postBuild
    '';

    installPhase = args.installPhase or ''
      runHook preBuild
      ${installPhaseCommand}
      runHook postBuild
    '';
  })
