# FUTURE WORK

Ideas not started. No approval yet. Not a todo list.

## Analytics: ad-block blind spot
1. uBlock Origin and similar block GA4. 20-40% of visitors invisible.
2. Confirmed 2026-08-19 — uBlock swapped gtag.js for a no-op surrogate, zero hits sent, zero errors shown.
3. GA4 numbers are a floor, not real traffic. Trends still valid.

### Options
1. Keep GA4 only. Accept the gap. Zero work.
2. Server log analysis with GoAccess. Reads web server access logs, unblockable, never touches the browser.
3. GoAccess has no client detail — no screen size, no clicks — and bots inflate counts. Companion, not replacement.
4. Self-hosted analytics: Umami (lightest), Plausible CE, or GoatCounter. Best fit, the server already runs behind DuckDNS.
5. Script served from own domain -> most filter lists miss it.
6. Cookieless -> consent banner no longer required.
7. Own the data, no Google.
8. Cost: a container to run and maintain. New dependency, needs approval.

### Suggested path
1. Run self-hosted next to GA4 for a while.
2. Delta between the two = real ad-block rate.
3. Drop the weaker one after.

### Caveat
1. Much of that blocked traffic blocked on purpose.
2. Cookieless first-party analytics respects that.
3. Chasing filter lists is an arms race, and it makes the consent banner dishonest.

## MS Clarity
1. Deferred. GA4 first.

## Claude.local.md in git history
1. .gitignore said CLAUDE.local.md, the real file is Claude.local.md.
2. Case mismatch on a case-sensitive FS, so it was tracked all along.
3. Untracked 2026-08-20, but already-pushed commits still hold it.
4. Repo root is served by nginx, so it is web-readable too. nginx.conf denies *.conf only.
5. Option: leave it. Contents are mild — machine notes, style prefs, topic queue.
6. Option: deny dotfiles and *.local.md in nginx.conf.
7. Option: rewrite history. Breaks any clone.
8. Not urgent. Nothing secret in it today.
