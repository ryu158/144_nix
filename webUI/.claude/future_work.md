# FUTURE WORK

Ideas not started. No approval yet. Not a todo list.

## Analytics: ad-block blind spot

Problem: uBlock Origin and similar block GA4. 20-40% of visitors invisible. Confirmed 2026-08-19 - uBlock swapped gtag.js for a no-op surrogate, zero hits sent, zero errors shown.

GA4 numbers are a floor, not real traffic. Trends still valid.

### Options

1. Keep GA4 only. Accept gap. Zero work.
2. Server log analysis (GoAccess). Reads web server access logs. Unblockable, never touches browser. No client detail (no screen size, no clicks), bots inflate counts. Good companion, not replacement.
3. Self-hosted analytics. Umami (lightest), Plausible CE, or GoatCounter. Best fit - server already runs behind DuckDNS.
   - Script served from own domain -> most filter lists miss it
   - Cookieless -> consent banner no longer required
   - Own the data, no Google
   - Cost: container to run + maintain. New dependency, needs approval.

### Suggested path

Run self-hosted next to GA4 for a while. Delta between the two = real ad-block rate. Drop the weaker one after.

### Caveat

Much of that blocked traffic blocked on purpose. Cookieless first-party analytics respects that. Chasing filter lists is an arms race, and it makes the consent banner dishonest.

## Other

- MS Clarity (deferred, GA4 first)
- test_data.csv orphaned, keep/delete undecided

## Claude.local.md in git history

Untracked 2026-08-20, but already-pushed commits still hold it. Repo root is served by nginx, so it is web-readable too (nginx.conf denies *.conf only).
Options: leave it (contents are mild — machine notes, style prefs, topic queue) / deny dotfiles + *.local.md in nginx.conf / rewrite history (breaks any clone).
Not urgent. Nothing secret in it today.
