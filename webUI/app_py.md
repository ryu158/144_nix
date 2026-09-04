Big picture

browser (page_adv.ts)
   |  POST /api/interpolation/<method>   JSON
nginx  (location /api/  ->  127.0.0.1:35910)
   |
app.py        <- all HTTP: route, validate, caps, errors
   |  plain Python call
topics/interpolation/api_interp.py   <- all math, no Flask
   |
numpy / scipy

Two files, one split
1. app.py = HTTP only. Never does math.
2. api_interp.py = math only. No Flask import, no port. Callable without a server.
3. Split exists so math testable standalone, and so a second topic costs one import line.

app.py, top to bottom (app.py:24)
1. TOPICS = {'interpolation': api_interp} — one entry per topic. Key = URL segment.
2. Caps: 8 MB body, 20000 rows, 64 cols, 50000 query points. Stop one request eating the box.
3. BadRequest exception = caller's fault, always 4xx, never 500.
4. _table() — checks 2D list, applies caps, stringifies cells, drops a text header row.
5. _query() — asks the topic module to build the x values, rejects empty or oversize range.
6. _run() — glue: parse JSON, build table + query, call module.METHODS[method].
7. Error handlers: 400 / 413 / 404 / 500. All return {"error": ...}. Stack trace stays in the log.
8. /api/health — returns ok + topic list. This is what nginx 502 proves dead.
9. _register() (app.py:127) — the key part: loops every topic, every entry in its METHODS dict, and calls add_url_rule for /api/<topic>/<method>, POST only. No route written by hand.
10. app.run(host='127.0.0.1', ...) — loopback only, port INTERP_API_PORT, default 35910.

api_interp.py, the math side (api_interp.py:144)
1. Bottom METHODS dict = the contract. 4 keys → 4 routes appear. Add a 5th key, route exists, app.py untouched.
2. Every method signature is the same: (table, query) -> rows.
3. generate_range() — builds query x's, endpoint INCLUDED. np.arange avoided on purpose; it drops the endpoint and would disagree with interp_engine.ts at the last x.
4. _series_points() — pulls one y column, skips junk per series not per row, sorts by x.
5. _dedupe() — repeated x collapse to first y. scipy raises on duplicate x otherwise.
6. _evaluate() — the actual fit. linear via np.interp plus an explicit NaN mask, because np.interp silently clamps outside the domain. cubic/pchip/akima take extrapolate=False.
7. Too-thin series (cubic needs 4, akima 5) → that column blanks, request still succeeds.
8. interpolate() — assembles rows of strings, NaN written as empty cell. Strings in / strings out matches GridTable.getData(), so the page needs no conversion layer.
9. Rounding 6 decimals result / 9 on x — same as interp_engine.ts, which is why the two pages agree to 0.000e+00.

Request life, one trip
1. Page posts {data: [[...]], rangeMin, rangeMax, interval}.
2. Flask matches /api/interpolation/cubic.
3. _table + _query validate.
4. METHODS['cubic'] runs scipy.
5. jsonify(rows) back; page renders into output grid.
6. Any failure → {"error": "..."} with 4xx, page shows it in #status.

Adding a new topic (e.g. FFT)
1. Write topics/FFT/api_fft.py with a METHODS dict.
2. Add one line to TOPICS in app.py.
3. Routes appear. No nginx change — location




Whole Chain Process 
1. Server on — _register() builds 4 rules from TOPICS + METHODS; @app.route adds /api/health. Then app.run opens the socket and blocks.
2. Web POST — run() in page_adv.ts sends body {data, rangeMin, rangeMax, interval} to path /api/interpolation/<select value>.
3. nginx — location /api/ matches, body capped at 8m, forwarded to 127.0.0.1:{api_port_number} with the path unchanged.
4. Match — Flask looks the path up in the url_map.
   - hit + POST allowed → that route's view, carrying topic/method frozen in its defaults since startup
   - no hit → 404 handler
   - hit but wrong HTTP method → 405
5. _run(topic, method) — now the body is read and validated: _table (caps, header drop), _query (range built, size checked). Then METHODS[method](rows, query) → scipy.
6. Errors — bad input → BadRequest → 400 {"error": ...}. Oversize → 413. Anything unexpected → logged, 500 {"error":"internal error"}.
7. Back — jsonify(rows) down the same connection → res.json() → grid_2.setData(rows).


              │       app.run(host, port)       │ _run(topic, method)  │
├──────────────┼─────────────────────────────────┼──────────────────────┤
│ whose        │ Flask's, from the library       │ ours, app.py:91      │
├──────────────┼─────────────────────────────────┼──────────────────────┤
│ how often    │ once, at startup                │ once per request     │
├──────────────┼─────────────────────────────────┼──────────────────────┤
│ what it does │ opens the socket, loops forever │ does one calculation │
├──────────────┼─────────────────────────────────┼──────────────────────┤
│ returns      │ never (until Ctrl-C)            │ the output rows


