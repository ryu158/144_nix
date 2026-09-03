- Interpolation_cal.html
0. REF
0-1. html: topics/interpolation/interpolate_cal.html
0-2. blog: ./interpolate_blog.html
0-3. calculation: ./interp_engine.ts

1. contents: input -> calculation -> output

2. input: grid (responsive range)
2-1. allowed: copy & paste, edit cell
2-2. limited: rows=10(1st display), col#_x = 1, col#_y =< 3, alarm message for crossing this rule
2-3. default: sample data (50 points that is used in the figure in blog)

3. calculation: REF(0-3), linear method only

4. output: grid, read only

5. 1st row: follow the style REF(0-1)
5-1. title
5-2. "interpolation?": link to interpolation_blog
5-3. "Home": link to home index
5-4. "Advanced": link to interpolate_adv, log_in acquire (deferred)

6. 2nd row: toggle
6-1. default: collapsed
6-2. name: How to use this site?
6-3. 1st part: what this site do, briefing
6-4. 2nd part: simple & actual manual
6-5. consider SEO

7. 3rd row: input ranges 3, list box 1, cal button 1
7-1. output X start: REF(0-1)
7-2. output X finish: REF(0-1) 
7-3. output X interval:  REF(0-1)
7-4. Methods: linear only
7-5. interpolate: run calculation and plot

8. 4th row: input grid, output grid, chart
8-1. input: REF(0-1)
8-2. output: REF(0-1)
8-3. chart: REF(0-1)

- interp_engine.ts
0. REF
0-1. contents: ./interpolate_blog.html, Methods linear

1. role: calculation only, no DOM, no event, no I/O
1-1. no dependency, no import/export

2. input: 2d table, col 0 = x, col 1..N = y series
2-1. each y column independent
2-2. skip a point when its x or its y is blank or not a number
2-3. sort by x, paste order not trusted

3. method: linear only, list must match the method box REF(0-2)

4. no extrapolation: query x outside a series range = blank cell
4-1. blank, not 0, not error
4-2. range is per series

5. output: 1 row per query x, col 0 = x, then 1 col per input y series
5-1. round result

6. range generator: start, finish, interval -> ascending query x list
6-1. bad input (not number, interval =< 0, finish < start) = empty list, no crash
6-2. no clamping to input range, REF(4) handles it