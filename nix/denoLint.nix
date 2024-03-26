{ mkDenoDerivation }:

{ pname, src ? null, ... }@args:
  mkDenoDerivation (args // {
    pname = "${args.pname}-lint";

    buildPhaseCommand = ''
      deno lint --config "$denoConfig" .
    '';

    installPhaseCommand = ''
      touch "$out"
    '';
  })
