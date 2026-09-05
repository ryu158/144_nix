0. common
0-1. style has to have consistency for whole webUI project
0-2. main tool is served by dev_basic
0-3. SEO optimization & anlytics tools have to set for blog & cal pages (later)
0-4. acceess to advanced page has to be under payment (later)


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

2-2-1. 1col for x, max 3 col for y
2-2-2. copy & paste
2-2-3. default sample

2-3-1. no edit allowed except but copy to memory

2-4-1. chart can be generated in pop-up window
2-4-2. legend can be displayed or not


3. adv
3-1. range: min, max, interval
3-2. input: grid 
3-3. output: grid
3-4. chart plot
3-5. method: linear, Cubic Spline, PCHIP, Akima
3-6. python back-end for methods but linear: linear use the client-side logic

3-2-1. 1col for x, no limit for col # for y
3-2-2. copy & paste + import/export csv/tsv
3-2-3. default sample (optimized for displaying the difference of each method)

3-3-1. no edit allowed except but copy to memory

3-4-1. chart can be generated in pop-up window
3-4-2. legend can be displayed or not
3-4-3. user can choose which colums to display in chart (later)
3-4-4. user can set the color pallette (later)
3-4-5. user can set 'parallel computing' or 'GPU' for a big data set (later)