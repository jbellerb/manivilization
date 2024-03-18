{ runCommandLocal, vendorDenoDeps }:

{ src
, denoConfig ? null
, denoLock ? null
}@args:
  let
    denoConfigParsed = builtins.fromJSON (builtins.readFile
      (args.denoConfig or src + "/deno.json"));
    denoLockParsed = builtins.fromJSON (builtins.readFile
      (args.denoLock or src + "/deno.lock"));

    vendoredDeps = vendorDenoDeps {
      denoImports = denoConfigParsed.imports;
      denoLock = denoLockParsed;
    };
    vendoredDenoConfig =
      (builtins.removeAttrs denoConfigParsed [ "imports" "scopes" ]) // {
        importMap = "${vendoredDeps}/import_map.json";
      };

  in runCommandLocal "build-deno-env" { inherit src; } ''
    mkdir -p "$out"
    cp -r "$src/." "$out/."

    # Replace the preexisting Deno config with the one patched to use our
    # vendored dependencies.
    rm -f "$out/deno.json"
    cat > "$out/deno.json" << "EOF"
    ${builtins.toJSON vendoredDenoConfig}
    EOF
  ''
