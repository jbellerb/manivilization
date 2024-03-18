{ mkDenoDerivation, deno }:

{ pname, src ? null, ... }@args:
  mkDenoDerivation (args // {
    pname = "${args.pname}-lint";

    denoEnv = args.denoEnv or src;

    buildPhaseCommand = ''
      ${deno}/bin/deno lint
    '';

    installPhaseCommand = ''
      touch "$out"
    '';
  })
