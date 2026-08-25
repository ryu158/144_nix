{
  description = "SilverBullet for my_wiki";

  # 25.11, not the repo's 24.05: 24.05 ships silverbullet 0.7.7, pre-2.0.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { self, nixpkgs }:
    let
      system = "aarch64-linux";
      pkgs = import nixpkgs { inherit system; };
      space = "/home/opc/nix/my_wiki";
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.silverbullet ];
        shellHook = ''echo "silverbullet ready! space = ${space}"'';
      };

      packages.${system} = {
        sb_start = pkgs.writeShellScriptBin "sb-start" ''
          set -euo pipefail
          export SB_MAX_DOCUMENT_SIZE=2048 SB_MAX_ATTACHMENT_SIZE=2048
          export SB_SHELL_BACKEND=off              # no shell commands from a page
          set -a; . "$HOME/.config/silverbullet/env"; set +a   # SB_USER=user:password
          exec ${pkgs.silverbullet}/bin/silverbullet --port 35909 -L127.0.0.1 ${space}
        '';

        # after editing the env file: check it, then swap the process
        sb_ps_update = pkgs.writeShellScriptBin "sb_ps_update" ''
          set -euo pipefail
          env="$HOME/.config/silverbullet/env"

          # check before killing anything
          [ -f "$env" ] || { echo "no $env"; exit 1; }
          val=$(set -a; . "$env"; set +a; printf '%s' "''${SB_USER:-}")
          case "$val" in
            "")  echo "SB_USER empty or missing - would start with NO login"; exit 1 ;;
            *:*) : ;;
            *)   echo "SB_USER has no ':' - need user:password"; exit 1 ;;
          esac
          [ -n "''${val%%:*}" ] || { echo "empty username"; exit 1; }
          [ -n "''${val#*:}"  ] || { echo "empty password"; exit 1; }

          # kill whoever holds 35909 - NOT `pkill -f silverbullet.js`, which also
          # kills any shell whose command line happens to mention that string
          pid=$(${pkgs.iproute2}/bin/ss -tlnpH 'sport = :35909' 2>/dev/null \
                | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)
          if [ -n "''${pid:-}" ]; then
            kill "$pid" 2>/dev/null || true
            for i in $(seq 10); do
              ${pkgs.iproute2}/bin/ss -tlnH 'sport = :35909' | grep -q . || break
              sleep 1
            done
          fi
          nohup ${self.packages.${system}.sb_start}/bin/sb-start >"$HOME/sb.log" 2>&1 &

          # 401 is the only proof login is on; 200 means wide open
          for i in $(seq 20); do
            sleep 1
            code=$(${pkgs.curl}/bin/curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:35909/.fs/ || true)
            [ "$code" = "401" ] && { echo "up, login on as ''${val%%:*}"; exit 0; }
            [ "$code" = "200" ] && { echo "up but NO LOGIN - check $env"; exit 1; }
          done
          echo "did not come up - see $HOME/sb.log"; exit 1
        '';
      };
    };
}

# start:  nix run .#sb_start &
# apply:  nix run .#sb_ps_update      (after editing the env file)
# login:  ~/.config/silverbullet/env  ->  SB_USER=user:password
# nginx fronts 127.0.0.1:35909 at https://ryuora144sb.duckdns.org
#
# ps aux | grep silverbullet
# sudo pkill -f silverbullet
# wait for the loading message. do not ctrl-c through it.
