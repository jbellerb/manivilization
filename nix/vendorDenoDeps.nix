{ lib, downloadDenoModule, runCommandLocal }:

{ denoImports, denoLock }:
  let
    remoteModules = if denoLock.version == "3" then denoLock.remote else
      throw "Deno lock file has an unsupported version: ${denoLock.version}";

    pathIsDir = lib.hasSuffix "/";

    pathHasExtension = path: builtins.any (ext: lib.hasSuffix ext path)
      [ ".js" ".ts" ".mjs" ".mts" ".jsx" ".tsx" ".json" ];

    missingExt = path: !(pathIsDir path) && !(pathHasExtension path);

    removeProtocol = url: builtins.head (builtins.match "https?://(.*)" url);

    urlToVendorPath = url:
      let path = lib.head (lib.splitString "?"
        (builtins.replaceStrings [ "*" ] [ "_" ] (removeProtocol url)));
      # As Deno lock files don't note the expected file type of modules, it
      # is impossible to resolve this if the import path doesn't end in one.
      # I think this is an issue with Deno. Until it's fixed, the best I can
      # do is assume it's plain .js
      in path + lib.optionalString (missingExt path) ".js";

    getUniquePath = set: path:
      let getUniquePath' = idx:
        let newPath = "${path}_${idx}";
        in if set ? newPath then getUniquePath' (idx + 1) else newPath;
      in if set ? path then getUniquePath 2 else path;

    moduleMapping = lib.foldlAttrs (acc: url: sha256:
      let
        path = getUniquePath acc.paths (urlToVendorPath url);
        baseSpecifier = lib.concatMapStrings (s: s + "/")
          (lib.take 3 (lib.splitString "/" url));
        module = downloadDenoModule { inherit url sha256; };
      in {
        paths = acc.paths // { ${path} = null; };
        baseSpecifiers = acc.baseSpecifiers // { ${baseSpecifier} = null; };
        mappings = acc.mappings // { ${url} = { inherit path module; }; };
      }
    ) { paths = { }; baseSpecifiers = { }; mappings = { }; } remoteModules;

  in runCommandLocal "build-vendor-dir" { } ''
    ${lib.concatStrings (lib.mapAttrsToList (url: mapping: ''
      mkdir -p "$out/${builtins.dirOf mapping.path}"
      cp "${mapping.module}" "$out/${mapping.path}"
    '') moduleMapping.mappings)}

    cat > $out/import_map.json << "EOF"
    ${builtins.toJSON {
      imports = (builtins.mapAttrs (_: url: "./${
        if pathIsDir url
          then urlToVendorPath url
          else moduleMapping.mappings.${url}.path
      }") denoImports) // (lib.foldlAttrs (acc: url: mapping: acc //
        (if !(missingExt url) then { } else (lib.foldlAttrs
          (acc: name: importUrl: acc //
            (if pathIsDir importUrl && lib.hasPrefix importUrl url
              then {
                "${name}${lib.removePrefix importUrl url}" =
                  "./${mapping.path}";
              } else { })
          ) { } denoImports) // {
            ${url} = "./${moduleMapping.mappings.${url}.path}";
          })
      ) { } moduleMapping.mappings) // (builtins.mapAttrs
        (specifier: _: "./${removeProtocol specifier}")
        moduleMapping.baseSpecifiers);
      scopes = lib.foldlAttrs (acc: url: _:
        let
          parts = lib.splitString "/" url;
          root = "./${builtins.elemAt parts 2}/";
          top = "${builtins.elemAt parts 3}/";
        in acc //
          { ${root} = acc.${root} or { } // { "/${top}" = root + top; }; }
      ) { } moduleMapping.mappings;
    }}
    EOF
  ''
