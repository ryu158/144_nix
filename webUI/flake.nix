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

        # Run the Flask application from this flake's directory.
        runApp = pkgs.writeShellScriptBin "run-interp-app" ''
          set -euo pipefail
          cd "${self}"
          exec ${pythonEnv}/bin/python app.py
        '';

        # Run Playwright tests inside the Nix environment.
        runBrowserTests = pkgs.writeShellScriptBin "run-browser-tests" ''
          set -euo pipefail

          cd "${self}"

          if [ ! -d node_modules/@playwright/test ]; then
            echo "Playwright is not installed."
            echo "Run:"
            echo "  npm ci"
            exit 1
          fi

          # Use the Nix chromium instead of a Playwright-downloaded browser.
          export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium

          exec ${pkgs.nodejs}/bin/npx playwright test "$@"
        '';

      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            # Python / Flask
            pythonEnv

            # JavaScript / TypeScript
            pkgs.nodejs
            pkgs.typescript

            # YouTube processing
            pkgs.yt-dlp
            pkgs.ffmpeg

            # Local headless browser
            pkgs.chromium
          ];

          shellHook = ''
            echo "========================================"
            echo "Interpolation project dev shell ready"
            echo "========================================"

            echo ""
            echo "Python:"
            echo "  python app.py"

            echo ""
            echo "TypeScript:"
            echo "  tsc -p tsconfig.json        # build once"
            echo "  tsc -w -p tsconfig.json     # watch"

            echo ""
            echo "Web app:"
            echo "  http://localhost:40001"

            echo ""
            echo "YouTube:"
            echo "  yt-dlp --version"

            echo ""
            echo "Browser:"
            echo "  chromium --version"

            echo ""
            echo "Browser tests:"
            echo "  npm ci"
            echo "  run-browser-tests"

            echo ""
            echo "YouTube summary:"
            echo "  yt-dlp --write-auto-subs --sub-langs en,ko \\"
            echo "    --sub-format vtt --skip-download URL"

            echo "========================================"
          '';
        };

        apps.default = {
          type = "app";
          program = "${runApp}/bin/run-interp-app";
        };

        apps.browser-test = {
          type = "app";
          program = "${runBrowserTests}/bin/run-browser-tests";
        };
      });
}
