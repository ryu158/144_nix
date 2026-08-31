{
  description = "Syncthing for my_wiki";

  # 25.11, not the repo's 24.05: 24.05 ships syncthing 1.27.7, pre-2.0.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { self, nixpkgs }:
    let
      system = "aarch64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.syncthing ];
        shellHook = ''echo "syncthing ready! gui = 127.0.0.1:8384"'';
      };

      packages.${system} = {
        st_start = pkgs.writeShellScriptBin "st-start" ''
          exec ${pkgs.syncthing}/bin/syncthing serve \
            --no-browser --no-upgrade --gui-address=127.0.0.1:8384
        '';

        # apply a hand-edited config.xml (<gui><user>/<password>), then bring
        # syncthing back. syncthing does NOT auto-hash a plaintext <password> on
        # startup (it just fails auth) - so if the edit left it plaintext, this
        # runs `syncthing generate` while stopped to hash it in place first.
        st_ps_update = pkgs.writeShellScriptBin "st_ps_update" ''
          set -euo pipefail
          home="$HOME/.local/state/syncthing"
          cfg="$home/config.xml"

          [ -f "$cfg" ] || { echo "no config.xml at $cfg"; exit 1; }

          gui_block=$(${pkgs.gnused}/bin/sed -n '/<gui[ >]/,/<\/gui>/p' "$cfg")
          u=$(printf '%s\n' "$gui_block" | ${pkgs.gnused}/bin/sed -n 's/.*<user>\(.*\)<\/user>.*/\1/p' | head -1)
          p1=$(printf '%s\n' "$gui_block" | ${pkgs.gnused}/bin/sed -n 's/.*<password>\(.*\)<\/password>.*/\1/p' | head -1)

          [ -n "$u" ] || { echo "no <user> found in $cfg"; exit 1; }

          plaintext=0
          case "$p1" in
            '$2a$'*|'$2b$'*|'$2y$'*) ;;  # already hashed, nothing to do
            "") ;;                       # nothing to verify
            *) plaintext=1 ;;
          esac

          # kill by port owner, never `pkill -f syncthing` - that also kills any
          # shell whose command line mentions the word.
          pid=$(${pkgs.iproute2}/bin/ss -tlnpH 'sport = :8384' 2>/dev/null \
                | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)
          if [ -n "''${pid:-}" ]; then
            kill "$pid" 2>/dev/null || true
            for i in $(seq 10); do
              ${pkgs.iproute2}/bin/ss -tlnH 'sport = :8384' | grep -q . || break
              sleep 1
            done
          fi

          if [ "$plaintext" = 1 ]; then
            # generate silently skips the password update when the plaintext
            # it's given string-equals what's already in config.xml - which is
            # always true here, since we just read $p1 out of that same file.
            # blank the field first so the "unchanged" skip can't trigger.
            ${pkgs.gnused}/bin/sed -i '/<gui[ >]/,/<\/gui>/ s#<password>.*</password>#<password></password>#' "$cfg"
            # hash the hand-typed password into config.xml while stopped.
            # password on stdin, never argv - argv shows up in ps and history
            printf '%s' "$p1" | ${pkgs.syncthing}/bin/syncthing generate \
              --home "$home" --gui-user="$u" --gui-password=- 2>&1 | grep -i "gui auth" || true
          fi

          nohup ${self.packages.${system}.st_start}/bin/st-start >"$HOME/st.log" 2>&1 &

          for i in $(seq 25); do
            sleep 1
            ${pkgs.curl}/bin/curl -sf -o /dev/null http://127.0.0.1:8384/ && break
          done

          if [ "$plaintext" != 1 ]; then
            echo "up, config applied for $u (no plaintext password to verify)"
            exit 0
          fi

          # prove the freshly hand-edited password actually logs in
          j=$(mktemp)
          ${pkgs.curl}/bin/curl -s -c "$j" -o /dev/null http://127.0.0.1:8384/
          payload=$(${pkgs.jq}/bin/jq -n --arg u "$u" --arg p "$p1" '{username:$u,password:$p}')
          code=$(${pkgs.curl}/bin/curl -s -b "$j" -o /dev/null -w '%{http_code}' \
            -X POST -H 'Content-Type: application/json' \
            -d "$payload" \
            http://127.0.0.1:8384/rest/noauth/auth/password)
          rm -f "$j"

          if [ "$code" = "204" ]; then
            echo "up, gui login verified for $u"
          else
            echo "login check failed ($code) - see $HOME/st.log"; exit 1
          fi
        '';

        # one-off. tcp 22000 was already open; these two were not.
        open_ports = pkgs.writeShellScriptBin "st-open-ports" ''
          sudo firewall-cmd --zone=public --permanent --add-port=22000/udp
          sudo firewall-cmd --zone=public --permanent --add-port=21027/udp
          sudo firewall-cmd --reload
          sudo firewall-cmd --list-ports
        '';
      };
    };
}

# start: nix run .#st_start &
# ports: nix run .#open_ports        (already done)
# passwd: nix run .#st_ps_update       (applies hand-edited config.xml, restarts)
#
# gui is loopback only:
#   ssh -L 8384:localhost:8384 opc@ryuora144.duckdns.org  ->  http://localhost:8384
#   set a gui password, share /home/opc/nix/my_wiki/my_wiki_vault

# --no-default-folder was removed in syncthing 2.x
# --no-upgrade: binary is a store path, self-upgrade cannot work
#  pw hint: see /.config/silverbullet/env

# data/config: ~/.local/state/syncthing
# ~/.local/state/syncthing/config.xml
# generate new password and hashed password into config.xml
# syncthing generate --gui-user=NEWUSER --gui-password=NEWPASSWORD

