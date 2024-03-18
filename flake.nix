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

      freshLib = import ./nix/default.nix { inherit (pkgs) lib newScope; };

    in {
      packages."${system}" = rec {
        manivilization = freshLib.buildFreshSite {
          pname = "manivilization";
          version = "0.1.0";

          src = nixpkgs.lib.cleanSource ./.;

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
        };

        manivilization-container = pkgs.callPackage ({ dockerTools }:
          dockerTools.buildLayeredImage {
            name = "manivilization";
            tag = pkgs.manivilization.version;

            fakeRootCommands = ''
              ${dockerTools.shadowSetup}
              useradd --system --user-group --create-home manivilization
            '';
            enableFakechroot = true;

            config = {
              Entrypoint = [ "${pkgs.deno}/bin/deno" "run" ];
              Cmd = [ "-A" "--no-remote" "${pkgs.manivilization}/main.ts" ];
              Env = [ "DENO_DIR=${pkgs.manivilization.cache}" ];
              User = "manivilization";
              ExposedPorts = { "8000/tcp" = {}; };
            };
          }
        ) {};

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
