{
  description = "Data interpolation web app (Flask + NumPy + SciPy)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";

    # yt-dlp ONLY. YouTube rotates its extractor surface constantly, so yt-dlp
    # is the one package here that cannot sit on a release pin - 24.05 ships
    # 2024.12.06, which YouTube now rejects with a bot check. Everything the
    # site actually depends on stays on 24.05 on purpose.
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";

    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, nixpkgs-unstable, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        unstable = import nixpkgs-unstable { inherit system; };

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
        # Deliberately runs in the caller's working directory, NOT in ''${self}:
        # the store copy has no node_modules, so cd-ing there always looked
        # like "Playwright is not installed".
        runBrowserTests = pkgs.writeShellScriptBin "run-browser-tests" ''
          set -euo pipefail

          if [ ! -f playwright.config.ts ]; then
            echo "No playwright.config.ts here. Run this from the webUI/ directory."
            exit 1
          fi

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

        # The backend, as something systemd can start.
        #
        # It cd's to the WORKING TREE, deliberately, NOT to ''${self}. nginx serves
        # this repo directly - "build = live" in CLAUDE.md - so the API has to run
        # the same files. ''${self} is a store snapshot of git-TRACKED files only,
        # which would put an uncommitted api_interp.py edit live on the page and
        # invisible to the API at the same time.
        #
        # Build it with an out-link before enabling the service:
        #   nix build .#interp-api --out-link ~/.local/state/nix/interp-api
        # That symlink is a GC ROOT. Without it the only thing holding the python
        # closure is the running process, and a nix-collect-garbage while the
        # service is stopped would delete the interpreter out from under it.
        interpApi = pkgs.writeShellScriptBin "interp-api" ''
          set -euo pipefail
          cd /home/opc/nix/webUI
          # Port comes from INTERP_API_PORT, default 35910 in app.py. It must match
          # api_port in ~/nix/nginx/nginx-secrets.nix.
          exec ${pythonEnv}/bin/python app.py
        '';

        # Regenerate the og:image cards in og/.
        # Same reason as runBrowserTests for running in the caller's directory:
        # the store copy has no node_modules, and this needs Playwright too.
        genOgImages = pkgs.writeShellScriptBin "gen-og-images" ''
          set -euo pipefail

          if [ ! -f tools/gen-og.js ]; then
            echo "No tools/gen-og.js here. Run this from the webUI/ directory."
            exit 1
          fi

          if [ ! -d node_modules/@playwright/test ]; then
            echo "Playwright is not installed."
            echo "Run:"
            echo "  npm ci"
            exit 1
          fi

          export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium

          exec ${pkgs.nodejs}/bin/node tools/gen-og.js "$@"
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

            # YouTube processing.
            # yt-dlp from unstable (see the input comment). ffmpeg stays on
            # 24.05 - subtitle extraction never invokes it, and a second ffmpeg
            # closure would buy nothing.
            unstable.yt-dlp
            pkgs.ffmpeg

            # Local headless browser
            pkgs.chromium

            # The test runner the shellHook advertises. Without this it only
            # existed as `nix run .#browser-test`, so `run-browser-tests` was
            # never actually on PATH.
            # runApp is NOT here on purpose: it interpolates ${self}, which
            # would copy the repo into the store every time the shell starts.
            # Use `nix run .` for the Flask app.
            runBrowserTests

            # og:image cards. Rebuild after any spec.json `card` change - the
            # images carry that text, so a stale card is a wrong social preview.
            genOgImages
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
            echo "  yt-dlp --version          # from nixpkgs-unstable, not the 24.05 pin"

            echo ""
            echo "Browser:"
            echo "  chromium --version"

            echo ""
            echo "Browser tests:"
            echo "  npm ci"
            echo "  run-browser-tests"

            echo ""
            echo "Social cards:"
            echo "  gen-og-images             # rebuilds og/*.png from spec.json"

            echo ""
            echo "YouTube summary:"
            echo "  yt-dlp --write-auto-subs --sub-langs en,ko \\"
            echo "    --sub-format vtt --skip-download URL"
            echo "  Bot check? add --cookies-from-browser or --cookies cookies.txt"
            echo "  Still failing? nix flake update nixpkgs-unstable"

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

        apps.gen-og-images = {
          type = "app";
          program = "${genOgImages}/bin/gen-og-images";
        };

        # Referenced by ~/.config/systemd/user/interp-api.service through its
        # out-link. See the interpApi comment above.
        packages.interp-api = interpApi;
      });
}
