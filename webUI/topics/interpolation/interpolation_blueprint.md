0. common
0-1. style has to have consistency for whole webUI project
0-2. main tool is served by dev_basic
0-3. SEO optimization & anlytics tools have to set for blog & cal pages (later)
0-3-1. SEO tags live in the raw html, static: a crawler does not run js
0-3-2. internal links use public urls, never the topic html path, every public url in sitemap
0-4. acceess to advanced page has to be under payment (later)
0-5. spec.json owns every value a page shows: title, description, dataset, range, method list
0-5-1. never hardcode any of them in a page, the method list included


1. blog
1-1. What is interpolation
1-2. Methods

1-2-1. Linear (1D) 
1-2-2. Cubic Spline 
1-2-3. Monotone cubic / PCHIP
1-2-4. Akima
1-2-5. FFT (spectral)
1-2-6. Which one should you pick

** have to be same under structure for each category of method
1-2-*-1. In plain words
1-2-*-2. Basic idea
1-2-*-3. Important characteristics
1-2-*-3-1. Advantages
1-2-*-3-2. Disadvantages


2. cal
2-1. range: min, max, interval
2-2. input: grid 
2-3. output: grid
2-4. chart plot
2-5. method: linear only
2-6. enging: ts based, client-side engine (no back-end)
2-7. no upload: this page computes in the browser, the claim must stay true

2-2-1. 1col for x, max 3 col for y
2-2-2. copy & paste
2-2-3. default sample

2-3-1. no edit allowed except but copy to memory

2-4-1. chart can be generated in pop-up window
2-4-2. legend can be displayed or not

2-6-1. skip a point when its x or its y is blank or not a number
2-6-2. sort by x, paste order not trusted
2-6-3. each y column independent, own range
2-6-4. no extrapolation: query x outside a series range = blank cell, not 0, not error


3. adv
3-1. range: min, max, interval
3-2. input: grid 
3-3. output: grid
3-4. chart plot
3-5. method: linear, Cubic Spline, PCHIP, Akima
3-6. python back-end for every method, linear included: one path, no client-side math on this page
3-7. this page sends data to a server: say so, never reuse the cal "no upload" wording

3-2-1. 1col for x, no limit for col # for y
3-2-2. copy & paste + import/export csv/tsv
3-2-3. default sample (optimized for displaying the difference of each method)

3-3-1. no edit allowed except but copy to memory

3-4-1. chart can be generated in pop-up window
3-4-2. legend can be displayed or not
3-4-3. user can choose which colums to display in chart (later)
3-4-4. user can set the color pallette (later)
3-4-5. user can set 'parallel computing' or 'GPU' for a big data set (later)

3-6-1. same cleaning rules as cal 2-6, so the two pages agree on the same table
3-6-2. never sit silent on a failed request: running, failed, backend down all shown


4. api
4-1. one POST endpoint per method, JSON in, JSON out (via app.py, _register)
4-2. one backend for the whole site, not one per topic: a new topic is one module + one line
4-3. limits: max rows, max cols, max query points, request body cap
4-3-1. public endpoint taking an arbitrary array, a size cap is not optional
4-4. binds loopback only, nginx is its whole public face
4-5. stateless: nothing written to disk, no user data in logs
4-6. errors: readable message, never a stack trace


5. validate
5-1. test_in_data.md / test_out_data.md in the topic folder
5-2. paste in, diff out, match within tolerance
5-3. never by eye
