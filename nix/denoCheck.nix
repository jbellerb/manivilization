{ lib, mkDenoDerivation, deno }:

{ pname, src, ... }@args:
  mkDenoDerivation (args // {
    pname = "${args.pname}-check";

    denoEnv = args.denoEnv or src;

    # When Deno builds its lockfile, only executable JavaScript and TypeScript
    # are included, not separate type declarations in a .d.ts file. Normally
    # this isn't a problem as you really only need those during typechecking,
    # however I kind of need them during typechecking. Short of vendoring
    # everything, which I strongly don't want to do, my only option is to abuse
    # fixed-output derivations to grab them during the build. This heavily goes
    # against the spirit of nix, but since the real build is pure and this build
    # is purely to simplify CI checks, I'm fine with it for now. The hash
    # corresponds to an empty file, which is only generated during the install
    # phase if both check commands succeed.
    outputHash = "sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=";

    buildPhaseCommand = ''
      ${deno}/bin/deno check **/*.ts
      ${deno}/bin/deno check **/*.tsx
    '';

    installPhaseCommand = ''
      touch "$out"
    '';
  })
