{ downloadRemoteModule }:

{ specifier, denoLockParsed }:
  let
    scheme = builtins.head
      (builtins.match "^([A-Za-z][+\-.A-Za-z]*:).*$" specifier);

    remote = if denoLockParsed.version == "3"
      then denoLockParsed.remote or {}
      else throw "Deno lock file has an unsupported version: ${
        denoLockParsed.version
      }";

  in if scheme == "file:" then
    throw "Local specifiers can't be resolved: ${specifier}"
  else if scheme == "http:" || scheme == "https:" then
    downloadRemoteModule {
      url = specifier;
      sha256 = remote.${specifier};
    }
  else
    throw "Cannot resolve unrecognized specifier: ${specifier}"
