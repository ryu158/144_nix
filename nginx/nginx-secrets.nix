# /home/opc/nginx-secrets.nix
{
  domain = "ryuora144.duckdns.org";
  web_root = "/etc/nginx/prj/35908";
  sb_domain = "ryuora144sb.duckdns.org";
  sb_port   = "35909";
  st_port   = "8384";
  api_port  = "35910";   # webUI/app.py, loopback only
  openPortsStr = "443 80 22000 24001 35909 35908 35910";
}
