# user_todo

Actions the USER owns. Things Claude cannot do from inside webUI/, or that need
a human decision.

Facts about the code live in .claude/HANDOVER.md. When an item stops needing the
user, it leaves this file.

Last reviewed 2026-09-05.

## Dated

1. **TLS cert expires 2026-09-25.** Confirm renewal is automated. Renewal lives
   in ~/nix/nginx, outside webUI/. An expired cert breaks every page, the API,
   and the social cards at once. Check:
```
echo | openssl s_client -servername ryuora144.duckdns.org \
  -connect ryuora144.duckdns.org:443 2>/dev/null \
  | openssl x509 -noout -dates
```

2. **Search Console re-indexing.** Every public URL changed 2026-09-05 and none
   has been re-requested. Request indexing for:
```
/
/scientific_cal/
/scientific_cal/interpolate_blog
/scientific_cal/interpolate_cal
/scientific_cal/interpolate_adv
```
   Resubmit sitemap.xml. Confirm the three old URLs still 301 in the URL
   inspector. Daily quota is limited, so this spans a few days. Wait 1-2 weeks
   before judging results.

## Recurring

3. **After a reboot, start the backend by hand.** Decided 2026-09-05: manual, no
   systemd unit. Until it runs, /api/ returns 502.
```
cd ~/nix/webUI && nix run .
```

4. **After any path or URL change, deploy the nginx config.** The session hands
   you an updated file; webUI/ holds no copy on purpose.
```
cd ~/nix/nginx && nix run --impure .#update_nginx_conf
```

## Decisions blocking work

5. **FFT — four open questions.** scientific_cal/topics/FFT/FFT_blueprint.md
   section 6. Nothing FFT can be built until they are answered. Source zip is at
   ~/transfer/ryunote/fft.zip, outside this repo.

6. **test_data.csv** — keep or delete. Orphaned, undecided.

7. **/scientific_cal/interpolate_cal abbreviates "calculator".** A crawler reads
   the URL. Spelling it out costs a redirect, a sitemap edit and a canonical
   change — cheaper now than later, since the 301 machinery is already in the
   nginx config.

## Open, no deadline

8. **Score mobile externally.** The layout works below 900px and
   tests/mobile.spec.ts covers it, but PageSpeed and Lighthouse have never been
   run against any page.

9. **No SERP rank monitoring at all.**

10. **yt-dlp is blocked on a signed-in session.** Needs `--cookies` from a
    logged-in browser, or `--cookies-from-browser`. This box is headless with no
    YouTube session. Your call — do not expect Claude to go rummaging in
    ~/.config/chromium.

## Done

- 2026-09-05 — deployed the /scientific_cal nginx config. Site live, old URLs
  301 correctly.
- 2026-09-05 — confirmed the og:image cards render, by pasting a page link into
  Notion. That one check covers the tags, the PNG and the TLS cert together, and
  no local test can do it.
