{ mkDenoDerivation, deno }:

{ pname, src ? null, ... }@args:
  mkDenoDerivation (args // {
    pname = "${args.pname}-fmt";

    denoEnv = args.denoEnv or src;

    buildPhaseCommand = ''
      ${deno}/bin/deno fmt --check --ignore=deno.json,build_info.json
    '';

    installPhaseCommand = ''
      touch "$out"
    '';
  })
