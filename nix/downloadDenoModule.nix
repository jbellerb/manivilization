{ lib, deno, fetchurl }:

{ url, sha256 }:
  let
    userAgent = "Deno/${deno.version}";

  in fetchurl {
    inherit url sha256;
    name = lib.strings.sanitizeDerivationName url;

    curlOptsList = [ "--user-agent" userAgent ];
  }
