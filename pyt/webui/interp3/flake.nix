{
  description = "Data interpolation web app (Flask + NumPy + SciPy)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        pythonEnv = pkgs.python3.withPackages (ps: with ps; [
          flask
          numpy
          scipy
        ]);

        # Wrapper so `nix run` always executes app.py from this flake's own
        # directory, regardless of the caller's current working directory —
        # otherwise Flask can't find templates/index.html.
        runApp = pkgs.writeShellScriptBin "run-interp-app" ''
          set -euo pipefail
          cd "${self}"
          exec ${pythonEnv}/bin/python app.py
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [ pythonEnv pkgs.nodejs pkgs.typescript ];

          shellHook = ''
            echo "Interpolation project dev shell ready (Python ${pythonEnv.version or ""})."
            echo "Python server:  python app.py"
            echo "Rebuild TS engine:  (cd ts && tsc -p tsconfig.json)  -> writes ../interpolate.js"
            echo "Then open http://localhost:40001"
          '';
        };

        apps.default = {
          type = "app";
          program = "${runApp}/bin/run-interp-app";
        };
      });
}
