- interpolate_adv.html
0. REF
0-1. basic blueprint: ./interpolation_cal_blueprint.md
0-2. html: topics/interpolation/interpolate_adv.html
0-3. blog: ./interpolate_blog.html
0-4. calculation: api section below
0-5. data: ./spec.json

1. same as basic REF(0-1) except where stated below

2. input: grid, unlimited columns
2-1. col 0 = x, col 1..N = y series, no column lock, no truncation alarm
2-2. default: sample data, same as basic

3. calculation: api REF(0-4), not interp_engine.ts
3-1. methods: linear, cubic spline, PCHIP, Akima
3-2. no FFT: needs uniform x grid, does not fit arbitrary pasted data
3-3. method list from REF(0-5), never hardcoded in page

4. output: grid, read only, same as basic

5. 1st row
5-1. title
5-2. "interpolation?": link to interpolate_blog
5-3. "Home": link to home index
5-4. "Basic": link to interpolate_cal
5-5. log_in acquire: deferred

6. 2nd row: toggle, same as basic
6-1. must say data leaves the browser on this page
6-2. do NOT reuse the basic "no upload" wording, it is false here

7. 3rd row: same 3 ranges, method box, run button
7-1. state shown: running, failed, backend down
7-2. never sit silent on a failed request

8. 4th row: input grid, output grid, chart, same as basic
8-1. chart legend must cope with N series

9. head: own canonical, title, description
9-1. data-level="advanced"
9-2. description must not claim "no upload"

10. wiring
10-1. REF(0-5): add "advanced" to levels and pages, home grows the button by itself
10-2. sitemap: add /interpolate_adv
10-3. basic page "Advanced" button points here by public url
10-4. drop the nav.spec.ts exemption for that href

- api
0. REF
0-1. python env: webUI/flake.nix pythonEnv (flask, numpy, scipy, already there)
0-2. nginx master: ~/nix/nginx/configs/nginx.conf, outside webUI scope
0-3. note: webUI/app.py does not exist yet, flake runApp points at it

1. role: one POST endpoint, JSON in, JSON out
1-1. in: y series table + query x list + method
1-2. out: one interpolated series per input y series

2. methods: scipy only, no hand-rolled math
2-1. linear, cubic spline, PCHIP, Akima
2-2. same scipy calls as gen_figs.py, so results match the blog figures

3. input cleaning: same rules as basic REF(basic 2), so the two pages agree
3-1. skip a point when its x or its y is blank or not a number
3-2. sort by x
3-3. each y column independent, own domain

4. no extrapolation: query x outside a series range = blank
4-1. blank, not 0, not error

5. limits: max rows, max columns, max query points, request body cap
5-1. public endpoint, arbitrary payload, size cap is not optional

6. binds loopback only, nginx is its whole public face

7. stateless: nothing written to disk, no user data in logs

8. errors: bad JSON, unknown method, oversize payload
8-1. readable message, never a stack trace

- deploy & test
1. nginx: location /api/ proxy block in REF(api 0-2), copy the syncthing block shape
2. nginx: location = /interpolate_adv already added
3. service must be up for run-browser-tests, new prerequisite the basic page never had
4. fixture test_in_data.md carries 10 columns, this page is what finally uses all of it
5. port, process supervision, nginx edit: user owns them, out of webUI scope
