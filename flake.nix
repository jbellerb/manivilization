{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";

      pkgs = import nixpkgs {
        inherit system;
        overlays = [ self.overlays.default ];
      };

      denoLib = import ./nix/default.nix { inherit (pkgs) lib newScope; };

      src = nixpkgs.lib.cleanSourceWith {
        src = ./.;
        filter = (path: type:
          (nixpkgs.lib.cleanSourceFilter path type)
          && builtins.all (filter: builtins.baseNameOf path != filter)
            [ ".gitignore" ".helix" "flake.lock" "flake.nix" "nix" ]);
      };

      denoEnv = denoLib.buildDenoEnv { inherit src; };
      commonArgs = {
        pname = "manivilization";
        version = "0.1.0";

        inherit src;
      };

    in {
      packages."${system}" = rec {
        manivilization = denoLib.buildFreshSite (commonArgs // {
          inherit denoEnv;

          # Build throws errors unless *something* is present for the runtime
          # environment variables.
          postConfigure = ''
            export DATABASE_URL=postgresql://user@localhost/db
            export DISCORD_CLIENT_ID=0
            export DISCORD_CLIENT_SECRET=0
            export DISCORD_BOT_TOKEN=0
            export DISCORD_GUILD_ID=0
            export DISCORD_ADMIN_ROLE=0
          '';
        });

        manivilization-container = pkgs.callPackage ({ dockerTools }:
          dockerTools.buildLayeredImage {
            name = commonArgs.pname;
            tag = commonArgs.version;

            fakeRootCommands = ''
              ${dockerTools.shadowSetup}
              useradd --system --user-group --create-home manivilization
            '';
            enableFakechroot = true;

            config = {
              Cmd = [
                "${pkgs.deno}/bin/deno"
                "run"
                "-A"
                "--no-remote"
                "${pkgs.manivilization}/main.ts"
              ];
              Env = [ "DENO_DIR=${pkgs.manivilization.cache}" ];
              User = "manivilization";
              ExposedPorts = { "8000/tcp" = {}; };
            };
          }
        ) {};

        default = manivilization;
      };

      checks."${system}" = {
        manivilization-fmt = denoLib.denoFmt commonArgs;
        manivilization-lint = denoLib.denoLint commonArgs;
        manivilization-check = denoLib.denoCheck commonArgs;
      };

      apps."${system}" = rec {
        manivilization = {
          type = "app";
          program = "${pkgs.writeShellScriptBin "wrapped" ''
            export DENO_DIR=${pkgs.manivilization.cache}
            ${pkgs.deno}/bin/deno run -A --no-remote ${pkgs.manivilization}/main.ts
          ''}/bin/wrapped";
        };
        default = manivilization;
      };

      overlays.default = final: prev: { } // self.packages."${system}";

      devShells."${system}".default = pkgs.mkShell {
        nativeBuildInputs = [
          pkgs.deno
        ];
      };
    };
}
