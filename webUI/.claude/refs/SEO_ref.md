# SEO ref

Sources:
1. Hayley, 채널톡 — theory. https://www.youtube.com/watch?v=5evFsqf7NHE
2. Hayley, 채널톡 — the 6-step process. https://youtu.be/zd6d4kuNJA8
3. 베이지, 채널톡 CX manager — worked example, first try, #1. https://youtu.be/eTBFhU0prqE
4. 오석종, SEO agency — weighting + distribution. https://youtu.be/2YniNYN5Uww

1-3 are one house style: keyword tooling, tag placement, competitor arms race.
4 pushes back: that layer is a small slice of the score. Read 4 for WHAT to spend effort on, 1-3 for HOW to execute once you have.

---

# What actually moves the needle

Weighting of Google's 2024 ranking algorithm, per a US agency breakdown quoted in source 4. **Not published by Google** — treat as a strong claim, not gospel:

| | weight |
|---|---|
| content | **57%** |
| link building (internal + external) | **17%** |
| HTML structure | small |
| technical SEO | small |

Content + links = **74%**. The technical work everyone dreads is the tail, not the dog.

Google's own Search Essentials, compressed: **open the site so it can be seen -> make useful content carrying words people actually search -> tell people about it.** The rest of its guidance is ordinary site-building that any CMS handles by default.

**The principle**: do not try to satisfy the algorithm. Satisfy the searcher.
Google's goal is that people keep using Google, so the algorithm is just its implementation of that. Chasing the algorithm is a hard game. Serving the reader is an easy one.

---

# The 6 steps

1. **Keyword** — the goal of the content. Plant the flag BEFORE writing
2. **Competitor analysis** — know the wall before climbing
3. **Structure** — this IS the order the crawler reads. Design it on purpose
4. **Write** to that structure
5. **Index + distribute** — get it filed, and get real readers to it
6. **Monitor** — #1 does not stay #1

## 1. Keyword

- **대상 (target)**: what you want to own
- **의도 (intent)**: related, weaker, smaller. Eat these one by one, they compound, then the target falls

Finding them:
- keywordtool.io -> volume, trend, CPC, competition score
- Google autocomplete (free) -> what people search alongside. Target too small to autocomplete? Autocomplete a BIGGER sibling term and steal its set
- Google Keyword Planner, Naver 광고센터 -> raw volume
- Search Console -> queries that already brought you traffic. Even one visitor means you can win it

Judging them:
- tiny volume + high competition -> skip
- high volume + low competition -> the dream, basically does not exist
- **set your own threshold**. Small site: volume ~100 is fine, low-to-medium competition tolerable
- **cut keywords that do not fit the piece**, even at good volume

Source 3 took "CX 매니저": LOW volume, +189% trend. Bet on the rise, not the size.

## 2. Competitor analysis

Ahrefs. Search the **keyword** (not just a URL) -> who owns it, and per result:
- **Domain Rating** — yours tells you where you can realistically land
- **backlink count** of that page
- how many of your keywords it uses, its top keyword

Source 1-3 tactic: out-backlink or out-keyword them.
Source 4 disagrees with that framing — see "Beat them on usefulness" below.

## 3. Structure — 5 things the crawler reads

URL, title, heading tags, body text, image tags. Keywords into as many as possible, repeating across URL -> Title -> H1 -> H2.

**Do not stuff.** Crawlers measure **dwell time** and **scroll depth**. Humans bounce off keyword soup and the bounce is the signal. Mix related terms naturally.

### Three tags

1. **Title** — must carry the target keyword. ~50-60 chars EN, ~25-30 KR
2. **Meta description** — Google states it does NOT affect crawling. Write it anyway, it drives click rate. 3-4 lines
3. **Heading tags** — the important one. Crawler reads H1 -> H2 -> H3 in order. Every heading carries a target or intent keyword. H1 ~1 keyword, H2 ~3-5, H3 more. Headings alone should give the whole flow

**Image tags**: title = subject, alt = read aloud by screen readers. Not a direct crawler factor. Use keywords anyway.

## 4. Write

### Beat them on usefulness, not on keyword count

This is source 4's central move, and both its case studies won the same way — by shipping something the competing pages did not have:

- **사업 계획서**: everyone else explained. He explained *and attached a ready-to-use template*. Published end of Feb, business-plan season
- **인스타그램 마케팅**: everyone else theorised. He *collected real case studies* and explained why each worked

Not longer. Not denser in keywords. **Usable.**

Ghost gives heading shortcuts instead of hand-written HTML. Not required.

## 5. Index + distribute

**Index**: Search Console -> URL 검사 -> **색인 생성 요청**. One click, usually filed within 1-2 weeks. 색인 = index, your page shelved in Google's library.

**Distribute** — the part most people do mechanically and wrong.

Source 3's version: repost to Naver Blog and Brunch, link back. A backlink.
Source 4's version, and the reason his numbers moved: **post where that audience already gathers, framed as genuine sharing, link at the end.** He used a startup community. The community post itself pulled ~8,000 views, and those were *people*, who then clicked through and read.

Why it works, and it is not really about the link:
- good content + real readers = **long dwell time**
- external traffic arriving = Google decides the site is trustworthy **faster**
- you build the trust yourself instead of waiting to be granted it

That is the 57% and the 17% together — 74% of the score — without touching the technical tail.

## 6. Monitor

- Watch what competitors publish on your keyword
- More important: watch **your own SERP rank**, continuously. #1 one week, page 2 the next
- Trends move, so volume and competition move with them
- Slipped to page 2-3? **Merge similar posts into one stronger piece**, re-index, push back up
- Otherwise refresh the text periodically

---

# Myths (source 4, from his own test)

- **"Google sandboxes new sites for 6 months."** He ranked a brand-new site fast
- **"Stack 100 posts, or at least 50, before anything ranks."** He used **10 posts over 8 months**, roughly one a month

His counter: publish-and-wait means waiting for Google to grant trust — six months, a year, unknowable. Publish the best page for one keyword *and bring readers to it*, and you manufacture the trust yourself.

His numbers, from Search Console: 16 months, ~10,000 clicks, ~150,000 impressions, ~1,000 keywords ranking — and still climbing after he stopped publishing. It spilled into Bing and even Naver, on a site that is not a Naver blog.
Single best page: 3,500 clicks, 36,000 impressions, 118 keywords, ranked #2 for its target term.

**The shortcut is depth plus distribution. The long way round is technical study and content volume.**

---

# Social SEO — why combining beats either alone

| | traffic | conversion |
|---|---|---|
| SNS / community | good | poor — you do not own the platform, cannot design the funnel |
| SEO / own blog | poor — you do not rank yet | good — your site, your funnel |

Run them as one loop and each covers the other's weakness: SNS brings people in, they spend real time on your content, site trust rises, ranking rises, organic traffic compounds.

---

# Why it works (source 1)

Buying used to be: ad -> store -> touch shelf -> buy. The internet inserted a step BEFORE the store: **ZMOT** — reviews, comparison sites, search. Search is 40%+ of ZMOT. Google is 50%+ of search.

- top 2-3 Google slots are ads. Click rate ~2%
- organic click rate ~40%
- organic visitors convert 8-10x better
- ads cost ~8-9x more than in-house SEO
- ad traffic dies when payment stops. SEO rises slowly, falls slowly

**How search works**: crawling -> indexing -> ranking. **SERP** = first page; 75% never reach page 2.

**Ranking factors**: https not http; mobile friendly (Google scores /100, ~60-70 passes); page speed (shrink images, prefer jpg, move gif/video DOWN — machines read top to bottom); content quality and length; backlink quality.

Featured snippet = Google calling you the expert. Hard to win, easy to lose.

---

# Tools

| job | tool |
|---|---|
| volume + competition + trend | keywordtool.io (paid) |
| what people search | Google Keyword Planner, Naver 광고센터 |
| intent keywords | Google autocomplete (free) |
| what already brings YOU traffic | Google Search Console |
| competitor rank, Domain Rating, backlinks | Ahrefs |
| write without hand-coding tags | Ghost |
| indexing | Google Search Console |
| distribution | wherever that audience already gathers |

---

# Gaps here

Checked 2026-08-21.

**No distribution at all.** The biggest one. Not merely "zero backlinks" — nothing has ever been posted where computational-math readers gather. Per source 4 this is half the score and the reason a new domain ranks slowly. Fixing it is not a link-drop; it is a genuine post in a real community with the link at the end.

**The differentiator already exists and is not being used.** Source 4 won by attaching a usable template to an explainer. This site *is* the tool — a working calculator, not an article about one. That is the strongest asset here and nothing points at it.

**Two H1 tags on the blog page.** `interpolate_blog.html`: `Interpolation❓` in the header AND `Linear Interpolation` in the article. One H1 only.

**Calculator headings carry zero keywords.** `Input` / `Output` / `Results`.

**URL abbreviates the keyword.** `/interpolate_cal` — URL is crawler element #1 and never spells out "calculator". Changing it costs a redirect plus sitemap and canonical updates.

**Calculator page is thin.** One intro paragraph.

**Mobile friendliness unverified.** Ranking factor, never scored. Full-height three-panel grid with `body { overflow: hidden }`.

**No dwell-time signal.** future_work.md already notes pageviews cannot separate a 4-second bounce from a 6-minute read. It is a ranking input, not just analytics — and a calculator is a dwell-time machine if anyone reaches it.

**Indexing never requested.** HANDOVER TODO, still open.

**No rank monitoring.** Step 6 does not exist here.

Fine already: https, no images so speed is good, static tags in raw HTML, one H1 on cal and home.

**Strategy note.** The topic queue is convolution, aliasing, windowing, least squares. Source 4's evidence says depth on one keyword plus distribution beats breadth — 10 posts in 8 months outperformed the stack-100 advice. CLAUDE.md's "one topic at a time" already agrees. Finishing and distributing interpolation likely beats starting convolution.
