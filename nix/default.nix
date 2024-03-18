{ lib, newScope }:

lib.makeScope newScope (self:
  let
    inherit (self) callPackage;

  in {
    buildDenoEnv = callPackage ./buildDenoEnv.nix { };
    downloadDenoModule = callPackage ./downloadDenoModule.nix { };
    mkDenoDerivation = callPackage ./mkDenoDerivation.nix { };
    vendorDenoDeps = callPackage ./vendorDenoDeps.nix { };

    buildFreshSite = callPackage ./buildFreshSite.nix { };
    denoCheck = callPackage ./denoCheck.nix { };
    denoFmt = callPackage ./denoFmt.nix { };
    denoLint = callPackage ./denoLint.nix { };
  }
)
