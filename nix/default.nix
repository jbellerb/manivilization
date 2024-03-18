{ lib, newScope }:

lib.makeScope newScope (self:
  let
    inherit (self) callPackage;

  in {
    buildFreshSite = callPackage ./buildFreshSite.nix { };
    downloadDenoModule = callPackage ./downloadDenoModule.nix { };
    vendorDenoDeps = callPackage ./vendorDenoDeps.nix { };
  }
)
