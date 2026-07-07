{
	description = "Simple nginx hello server for Oracle Linux 9 using Nix";

	inputs = {
		nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
	};

	outputs = { self, nixpkgs }:
		let
		system = "aarch64-linux";
	pkgs = import nixpkgs { inherit system; };

	openPorts = [ 443 80 22000 24001 35909 35908 35910 ]; 
#sudo firewall-cmd --zone=public --add-port=35909/tcp --permanent
	firstPort = builtins.toString (builtins.elemAt openPorts 0);
	domain = "ryuora144.duckdns.org";
	path_ssl_cert = "/etc/letsencrypt/live/${domain}/fullchain.pem";
	path_ssl_cert_key = "/etc/letsencrypt/live/${domain}/privkey.pem";
	path_web_root = "/home/opc/nix/nginx/prj/35908";

	in
	{
		packages.${system} = {
			writeNginxConf = pkgs.writeTextFile {
				name = "nginx.conf";
				text = ''
# Run nginx as 'nginx' user/groups
					user nginx nginx;
				pid /run/nginx/nginx.pid;
				error_log /var/log/nginx/error.log;

				events{}

				http {
					server {
						listen 80;
						listen [::]:80;
						server_name ${domain};
						return 301 https://''$host''$request_uri;
					}

					server {
						listen 443 ssl;
						listen [::]:443 ssl;
						server_name ${domain};

						ssl_certificate ${path_ssl_cert};
						ssl_certificate_key ${path_ssl_cert_key};

						ssl_protocols TLSv1.2 TLSv1.3;
						ssl_prefer_server_ciphers on;

# 1. Allow large file uploads (attachments)
						client_max_body_size 2G;
						client_body_buffer_size 128k;

						root ${path_web_root};
						index index.html;

						location / {
							try_files $uri $uri/ /index.html;
						}
					}



					server {
						listen 35908;
						server_name localhost;

						root /home/opc/nix/nginx/prj/35908;
						index index.html;

						location / {
							try_files $uri $uri/ /index.html;
						}
					}
				}
				'';
			};

										'';

			update_firewall = pkgs.writeShellScriptBin "update firewall list" ''
				openPorts_bash=(${builtins.concatStringsSep " " (map toString openPorts)})
				for port in "${"$"}{openPorts_bash[@]}"; do
					sudo firewall-cmd --zone=public --add-port=$port/tcp --permanent
						done

						sudo firewall-cmd --reload
						sudo firewall-cmd --list-ports
						'';
		};
	      };
      }

# nix run .#nginx_Conf_update -> nginxConf update (/etc/nginx/nginx.conf) and apply (refresh)
# nix run .#get_SSL -- ryuora158.duckdns.org ryu ryuora158sb.duckdns.org -> getting SSL certificates
# nix build .#nginxService ->nginx.Service modify

# 1. check firewall: firewall-cmd --list-ports                                          

# 2. after modify index.html -> systemctl restart       

# 2. check port open in oracle cloud server setup (oracle cloud web login) 

# 3. check permission for folder and index files                                        
# nix flake update -> nix build .#install -> ./result@@@
# 4. nix run .#refresh_nginx        

# nginx set up guide
# 1. check nginx.conf (/etc/nginx/nginx.conf)
# 2. port open (sudo firewall-cmd --zone=public --add-port=$port/tcp --permanent, sudo firewall-cmd --list-ports, ss -tlnp | grep {port_num})
# 3. port open in instance level (subnet secure list -> add ingress rule)
# 4. generate all the folder and index.htmml file
# 5. check permission (all parents folders give at least 711)

# nginx setup modify
# 1. after modify nginx.conf -> sudo systemctl daemon-reload -> sudo systemctl enable --now nginx.service
# 2. after modify index.html -> sudo systemctl restart

# nix flake update -> nix build .#install -> ./result/bin/install-hello-nginx
# sudo vim /etc/nginx/nginx.conf
# after modify nginx.conf -> stop nginx.service -> daemon-reload -> enable --now
# after open firewall -> check subnet secure list in instance management -> ingress rule (add port)
# sudo ss -tlnp | grep nginx
# sudo ss -tulpn | grep -E '(80|35908)'

# systemctl status nginx.service
# sudo tail -n 50 /var/log/nginx/error.log
# after change the contents in index.html then 
# 'sudo systemctl restart nginx.service' for refresing
# every parents folders gives at least 711 permission (dwxr--x--x)
# check /home/opc permission if 700 -> generate 500 error

# paths
# nginx.conf = /etc/nginx/nginx.conf
# nginx.service = /etc/systemd/system/nginx.service
# error log = sudo tail -f /var/log/nginx/error.log, sudo journalctl -u nginx -fck /home/opc permission if 700 -> generate 500 error
