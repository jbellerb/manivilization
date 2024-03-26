{ lib
, runCommandLocal
, writeText
, downloadModuleFromSpecifier
, downloadRemoteModule
, graphAnalyzer
}:

{ rootModules
, denoConfig ? null
, denoConfigParsed ? null
, denoLock ? null
, denoLockParsed ? null
}@args:
  let
    denoConfig = args.denoConfig or (writeText "deno-config"
      (builtins.toJSON
        (args.denoConfigParsed or (throw "Missing attribute: denoConfig"))));
    denoLockParsed = args.denoLockParsed or (lib.importJSON
      (args.denoLock or (throw "Missing attribute: denoLock")));

    genModuleGraph = { specifiers, virtualRemotes ? null}:
      builtins.fromJSON (builtins.unsafeDiscardStringContext
        (builtins.readFile (runCommandLocal "build-module-graph" { } ''
          ${lib.optionalString (virtualRemotes != null) ''
            cat > "$TMPDIR/virtual_remotes.json" << 'EOF'
            ${builtins.toJSON virtualRemotes}
            EOF
          ''}${graphAnalyzer}/bin/graph-analyzer --config "${denoConfig}" ${
            lib.optionalString (virtualRemotes != null)
              "--virtual-remotes \"$TMPDIR/virtual_remotes.json\" "
          }${lib.concatStringsSep " "
            (builtins.map lib.escapeShellArg specifiers)} > $out
        '')));

    genModuleGraphRecursive = { rootModules, modules, redirects }:
      let
        graph = genModuleGraph {
          specifiers = builtins.map (module: module.specifier) rootModules;
          virtualRemotes = builtins.listToAttrs (builtins.map
            ({ module, specifier }: lib.nameValuePair specifier "${module}")
            rootModules);
        };
        partition = builtins.partition (module: module ? kind) (builtins.filter
          (module: !(builtins.hasAttr module.specifier modules)
            || !(modules.${module.specifier} ? kind))
          graph.modules);
        updated = {
          modules = modules // (builtins.listToAttrs (builtins.map
            (module: lib.nameValuePair module.specifier module)
            partition.right));
          redirects = lib.recursiveUpdate redirects graph.redirects;
        };
        nextLayer = genModuleGraphRecursive (updated // {
          rootModules = builtins.map (module: {
            module = downloadModuleFromSpecifier {
              inherit (module) specifier;
              inherit denoLockParsed;
            };
            inherit (module) specifier;
          }) partition.wrong;
        });
      in { inherit (graph) roots; } // (
        if partition.wrong == [ ] then updated
        else { inherit (nextLayer) modules redirects; }
      );

    graph = genModuleGraphRecursive {
      rootModules = builtins.map (module:
        if lib.hasPrefix "http:" module || lib.hasPrefix "https:" module then {
          module = downloadRemoteModule
            { url = module; sha256 = denoLockParsed.remote.${module}; };
          specifier = module;
        } else {
          inherit module;
          specifier = builtins.unsafeDiscardStringContext "file://${module}";
        }
      ) rootModules;
      modules = { };
      redirects = { };
    };

  in {
    inherit (graph) roots redirects;
    modules = lib.attrValues graph.modules;
  }
