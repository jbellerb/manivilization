{ lib, runtimeShell, mkDenoDerivation, vendorDenoDeps, deno }:

{ pname
, src
, entrypoint ? "main.ts"
, denoConfig ? null
, denoConfigParsed ? null
, denoLock ? null
, denoLockParsed ? null
, denoVendorDir ? null
, ...
}@args:
  let
    denoConfigParsed = lib.importJSON (args.denoConfig or (src + "/deno.json"));
    denoLockParsed = lib.importJSON (args.denoLock or (src + "/deno.lock"));

    denoVendorDir = args.denoVendorDir or (vendorDenoDeps {
      denoConfig = denoConfigParsed;
      denoLock = denoLockParsed;
    });

    vendoredDenoConfig =
      (builtins.removeAttrs denoConfigParsed [ "imports" "scopes" ]) // {
        importMap = "${denoVendorDir}/import_map.json";
      };

  in mkDenoDerivation (args // {
    pname = "${pname}-wrapper";

    outputs = [ "out" "cache" ];
    denoCacheDir = "$cache";

    # Empty eval is needed because sometimes deno cache doesn't initialize the
    # cache databases for node modules, which need to exist for the script to
    # start even if node modules aren't used.
    buildPhaseCommand = ''
      deno cache --config "$denoConfig" "${entrypoint}"
      deno eval --config "$denoConfig" ""
    '';

    installPhaseCommand = ''
      mkdir -p $out/bin
      cat > $out/bin/${pname} << EOF
      #!${runtimeShell}

      export PATH="${lib.makeBinPath [ deno ]}:\$PATH"
      export DENO_DIR=$cache

      deno run -A --no-remote --config $denoConfig ${src}/${entrypoint} "\$@"
      EOF

      chmod +x $out/bin/${pname}
    '';
  })
