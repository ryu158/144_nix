{
  description = "Basic flake.nix for nix on oracle 9";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
  };

  outputs = { self, nixpkgs }:
    let
      pkgs = import nixpkgs { system = "aarch64-linux"; };
      openPorts = [ 8080 35909 35908 35910 ];
      firstPort = builtins.toString (builtins.elemAt openPorts 0);
      direnvBin = "${pkgs.direnv}/bin/direnv";
      direnvHook = ''eval "$(${direnvBin} hook bash)"'';
      system = "aarch64-linux";
    in
    {
      devShell.${system} = pkgs.mkShell {
        packages = [ pkgs.direnv pkgs.nix-direnv ];

	shellHook = ''
          echo "Checking for direnv hook in ~/.bashrc..."
          if ! grep -q 'direnv hook bash' ~/.bashrc; then
            echo "Hook not found. Adding to ~/.bashrc..."
            echo "" >> ~/.bashrc
            echo "# Added by SilverBullet Nix Flake" >> ~/.bashrc
            echo '${direnvHook}' >> ~/.bashrc
            echo "Successfully added. Please run 'source ~/.bashrc' after exiting this shell."
          else
            echo "Direnv hook already exists in ~/.bashrc. Ready to go!"
          fi
        '';
      };

       packages.${system}.servers_init = pkgs.writeShellScriptBin "servers_init" ''
         sudo systemctl enable --now nginx.service
         (cd /home/opc/nix/my_wiki_servers/silverbullet && nix run .#sb_start &)
         (cd /home/opc/nix/my_wiki_servers/syncthing    && nix run .#st_start &)
         sleep 12
         sudo ss -tlunp | grep -E 'nginx|deno|syncthing'
      '';

    };
}

# add below to ~/.bashrc
# eval "$(/nix/store/wpj4la1jgf0p8aimfzx49gfr3228vk8f-direnv-2.37.1/bin/direnv hook bash)"{
