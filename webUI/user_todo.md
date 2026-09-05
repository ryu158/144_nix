# user_todo

1. Actions the USER owns.
2. Claude cannot do these from inside webUI/, or they need a human decision.
3. Code facts live in .claude/HANDOVER.md.
4. An item that stops needing the user leaves this file.

## Confirm

Believed true. Check, then delete the line.

1. TLS cert expires 2026-09-25. Confirm renewal is automated.
2. Renewal lives in ~/nix/nginx, outside webUI/.
3. Expired cert breaks every page, the API and the social cards at once.
```
echo | openssl s_client -servername ryuora144.duckdns.org \
  -connect ryuora144.duckdns.org:443 2>/dev/null \
  | openssl x509 -noout -dates
```
4. Every public URL changed 2026-09-05. None re-requested since.
5. Request indexing in Search Console for:
```
/
/scientific_cal/
/scientific_cal/interpolate_blog
/scientific_cal/interpolate_cal
/scientific_cal/interpolate_adv
```
6. Resubmit sitemap.xml.
7. Confirm the three old URLs still 301 in the URL inspector.
8. Daily quota is limited. Spans a few days.
9. Wait 1-2 weeks before judging results.

## Recurring

Procedures. They never finish, so they never leave.

1. After any path or URL change, deploy the nginx config.
2. The session hands you the updated file. webUI/ holds no copy on purpose.
```
cd ~/nix/nginx && nix run --impure .#update_nginx_conf
```
3. After any flake.nix change, rebuild the API out-link.
4. Skip it and the tmux session keeps starting the old closure.
```
cd ~/nix/webUI && nix build .#interp-api --out-link ~/.local/state/nix/interp-api
```
5. If /api/ returns 502, check the session before suspecting nginx.
```
tmux ls
~/nix/webUI/tools/start-api.sh
```

## Future work

Decisions and open items. Nothing here is running.

1. FFT: answer the four questions in scientific_cal/topics/FFT/FFT_blueprint.md section 6.
2. No FFT page can be built until they are answered.
3. Source zip is at ~/transfer/ryunote/fft.zip, outside this repo.
4. test_data.csv: keep or delete. Orphaned.
5. /scientific_cal/interpolate_cal abbreviates "calculator". Spell it out or leave it.
6. A crawler reads the URL.
7. Costs a redirect, a sitemap edit and a canonical change.
8. Cheaper now: the 301 machinery is already in the nginx config.
9. Score mobile with PageSpeed or Lighthouse. Never run against any page.
10. Set up SERP rank monitoring. None exists.
11. yt-dlp needs `--cookies` from a logged-in browser, or `--cookies-from-browser`.
12. This box is headless with no YouTube session.

## Specify for Claude

Requested 2026-09-05, not buildable as stated. Answer, then it leaves this file.

1. "User review space on each topic" — needs a spec.
2. What is it: comments, ratings, a feedback form, or a link elsewhere?
3. Where does the text go? The site is static, with one Flask backend and no database.
4. Who moderates it? Public and unmoderated becomes spam.
5. Consent: CLAUDE.md gates cookies behind opt-in, and every option here stores something.
