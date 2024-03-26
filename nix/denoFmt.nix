{ lib, mkDenoDerivation }:

{ pname, ignore ? [ ], ... }@args:
  let
    ignoreList = lib.concatStringsSep "," ([ "deno.json" ] ++ ignore);

  in mkDenoDerivation (args // {
    pname = "${pname}-fmt";

    buildPhaseCommand = ''
      deno fmt --config "$denoConfig" --check --ignore=${ignoreList} .
    '';

    installPhaseCommand = ''
      touch "$out"
    '';
  })
