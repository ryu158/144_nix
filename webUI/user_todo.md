# user_todo

1. Actions the USER owns.
2. Claude cannot do these from inside webUI/, or they need a human decision.
3. Code facts live in .claude/HANDOVER.md.
4. An item that stops needing the user leaves this file.

## Dated

1. TLS cert expires 2026-09-25.
2. Confirm renewal is automated.
3. Renewal lives in ~/nix/nginx, outside webUI/.
4. Expired cert breaks every page, the API and the social cards at once.
```
echo | openssl s_client -servername ryuora144.duckdns.org \
  -connect ryuora144.duckdns.org:443 2>/dev/null \
  | openssl x509 -noout -dates
```
5. Every public URL changed 2026-09-05. None re-requested since.
6. Request indexing in Search Console for:
```
/
/scientific_cal/
/scientific_cal/interpolate_blog
/scientific_cal/interpolate_cal
/scientific_cal/interpolate_adv
```
7. Resubmit sitemap.xml.
8. Confirm the three old URLs still 301 in the URL inspector.
9. Daily quota is limited. Spans a few days.
10. Wait 1-2 weeks before judging results.

## Recurring

1. After any path or URL change, deploy the nginx config.
2. The session hands you the updated file. webUI/ holds no copy on purpose.
```
cd ~/nix/nginx && nix run --impure .#update_nginx_conf
```
3. After any flake.nix change, rebuild the API out-link.
4. Skip it and the service keeps running the old closure.
```
cd ~/nix/webUI && nix build .#interp-api --out-link ~/.local/state/nix/interp-api
```

## Decisions blocking work

1. FFT: answer the four questions in scientific_cal/topics/FFT/FFT_blueprint.md section 6.
2. No FFT page can be built until they are answered.
3. Source zip is at ~/transfer/ryunote/fft.zip, outside this repo.
4. test_data.csv: keep or delete. Orphaned.
5. /scientific_cal/interpolate_cal abbreviates "calculator". Spell it out or leave it.
6. A crawler reads the URL.
7. Costs a redirect, a sitemap edit and a canonical change.
8. Cheaper now: the 301 machinery is already in the nginx config.

## Open

1. Score mobile with PageSpeed or Lighthouse. Never run against any page.
2. Set up SERP rank monitoring. None exists.
3. yt-dlp needs `--cookies` from a logged-in browser, or `--cookies-from-browser`.
4. This box is headless with no YouTube session.
