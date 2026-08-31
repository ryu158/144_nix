# Blog

## What is Interpolation

Suppose you have measured data: (x_1,y_1), (x_2,y_2), ... , (x_n,y_n) but you want to estimate yy at an xx where you did not measure it.

For example:

```
measured:
x = 1   2   3   4   5
y = 2   4   3   6   5

want:
x = 2.5

```

An interpolation method constructs a function y^=f(x)\hat y=f(x) that passes through, or is otherwise constrained by, the known data points.

## Methods

How do we construct the curve between the known points? We can implement this idea into real algorithm via Scipy library in python There is 6 major categories: linear, cubic spline, monotone cubic/PCHIP, Akima, and FFT-based

## Linear(1D) interpolation

Basic idea Take two neighboring data points and connect them with a straight line. For two points (x0,y0),(x1,y1)(x_0,y_0),\quad(x_1,y_1) the interpolation is y(x)=y0+y1−y0x1−x0(x−x0)y(x) = y_0+ \frac{y_1-y_0}{x_1-x_0}(x-x_0)

Important characteristic The curve itself is continuous: C0C^0 but its slope usually changes abruptly at every data point. So: f′(x)f'(x) is generally discontinuous. That's why your previous plot looked somewhat "uncontinuous" or jagged even though the curve itself technically has no gaps.

Advantages

- Very simple
- Very stable
- No overshoot
- Doesn't create artificial oscillations
- Good when the data itself may contain abrupt changes
- Very fast

Disadvantages

- Not smooth
- Derivative jumps at every point
- Poor visual representation of a naturally smooth physical process

## Cubic spline interpolation

Basic idea Instead of one straight segment per interval, fit a separate cubic polynomial on every interval, then force neighboring cubics to match in value, first derivative, and second derivative at each shared point. For each interval (xi,yi),(xi+1,yi+1)(x_i,y_i),\quad(x_{i+1},y_{i+1}) the local piece is Si(x)=ai+bi(x−xi)+ci(x−xi)2+di(x−xi)3S_i(x) = a_i + b_i(x-x_i) + c_i(x-x_i)^2 + d_i(x-x_i)^3 and the coefficients are solved as one global system so that Si(xi+1)=Si+1(xi+1),Si′(xi+1)=Si+1′(xi+1),Si′′(xi+1)=Si+1′′(xi+1)S_i(x_{i+1})=S_{i+1}(x_{i+1}), \quad S_i'(x_{i+1})=S_{i+1}'(x_{i+1}), \quad S_i''(x_{i+1})=S_{i+1}''(x_{i+1}) holds at every interior knot. Boundary conditions (natural, clamped, or "not-a-knot") close the remaining degrees of freedom.

Important characteristic The curve is smooth up to the second derivative: C2C^2 so both the slope and the curvature are continuous across data points. This is what makes cubic splines look "physically natural" compared to the linear case, but that same freedom lets the curve swing past the data between points. So: f′′(x)f''(x) is continuous, but the fitted curve can overshoot or undershoot near sharp changes in the data.

Advantages

- Very smooth (C2)
- Visually matches naturally smooth physical processes
- Widely used default, well studied
- Closed-form, fast to evaluate once solved

Disadvantages

- Can overshoot between points, especially near sharp jumps
- Not guaranteed to preserve monotonicity of the data
- Global solve: one bad point can distort the whole curve
- Sensitive to boundary condition choice

## Monotone cubic / PCHIP interpolation

Basic idea Keep the piecewise-cubic structure of a spline, but instead of solving a global system for the derivatives, estimate each derivative locally from the slopes of neighboring segments, then clip that estimate so the interpolant never overshoots and never creates a bump that isn't in the data. For each knot the derivative mim_i is chosen (e.g. via the Fritsch–Carlson method) so that if yi≤yi+1y_i \le y_{i+1} on both adjacent segments, the interpolated curve is also non-decreasing between xix_i and xi+1x_{i+1} . SciPy's PCHIP (Piecewise Cubic Hermite Interpolating Polynomial) is the standard implementation of this idea.

Important characteristic The curve is smooth in its first derivative but not necessarily in its second: C1C^1 so slope is continuous but curvature can kink at the knots. This is a deliberate trade-off: PCHIP gives up C2C^2 smoothness in exchange for guaranteed shape preservation. So: f′(x)f'(x) is continuous and, unlike the plain cubic spline, the interpolant is guaranteed monotone wherever the data is monotone.

Advantages

- No overshoot
- Preserves monotonicity of the original data
- Local computation: a change in one point doesn't ripple through the whole curve
- Good for data that should not "wiggle" (e.g. cumulative distributions, sensor readings)

Disadvantages

- Only C1, less smooth than a full cubic spline
- Slightly more conservative-looking curve than a spline
- Derivative estimates are heuristic, not derived from a global optimality condition

## Akima interpolation

Basic idea Like PCHIP, Akima interpolation builds a piecewise cubic using locally estimated derivatives rather than a global solve, but it estimates each slope as a weighted average of the two neighboring secant slopes, where the weights are based on how much the slopes themselves differ. For each knot the derivative estimate uses ti=∣mi+1−mi∣mi−1+∣mi−1−mi−2∣mi∣mi+1−mi∣+∣mi−1−mi−2∣t_i = \frac{|m_{i+1}-m_i|,m_{i-1} + |m_{i-1}-m_{i-2}|,m_i}{|m_{i+1}-m_i| + |m_{i-1}-m_{i-2}|} where each mkm_k is the secant slope of segment k. When neighboring slopes are consistent this behaves like a smooth spline; when they diverge sharply, the weighting favors the segment whose neighborhood is more stable, which suppresses overshoot.

Important characteristic The curve is C1C^1 continuous, similar to PCHIP, but Akima's weighting scheme makes it less prone to the wide, sweeping overshoots that cubic splines can produce near outliers, without imposing PCHIP's strict monotonicity constraint. So: f′(x)f'(x) is continuous, and the curve tends to hug the data more tightly than a standard cubic spline even in regions with rapid local changes.

Advantages

- Less overshoot than cubic spline
- Less sensitive to outliers/rapid local changes than cubic spline
- Locally computed, like PCHIP
- Good middle ground between spline smoothness and PCHIP's rigidity

Disadvantages

- Only C1, not as smooth as a full cubic spline
- Does not guarantee monotonicity (unlike PCHIP)
- Slightly more complex to reason about than linear or PCHIP
- Original Akima formulation can behave oddly with exactly duplicated slopes (division by zero in the weights), though SciPy's implementation handles this edge case

## FFT (spectral) interpolation

Basic idea Stop thinking about the curve one interval at a time. Instead, assume the whole sampled sequence is one period of a periodic, band-limited signal, decompose it into sinusoids, and rebuild it on a finer grid. For N uniformly spaced samples the forward transform is Xk=∑n=0N−1xne−2πikn/NX_k = \sum_{n=0}^{N-1} x_n e^{-2\pi i kn/N} The spectrum is then zero-padded from N to M > N coefficients (inserting zeros at the high frequencies, splitting the Nyquist term), and the inverse transform gives the resampled sequence ym=MN⋅1M∑k=0M−1X~ke2πikm/My_m = \frac{M}{N}\cdot\frac{1}{M}\sum_{k=0}^{M-1}\tilde X_k e^{2\pi i km/M} This is exactly Whittaker–Shannon sinc interpolation, wrapped periodically. SciPy exposes it as `scipy.signal.resample`.

Important characteristic The interpolant is a trigonometric polynomial, so it is infinitely differentiable: C∞C^\infty Every derivative is continuous everywhere, which is stronger than anything the piecewise methods offer. But the method is fully global: each output sample depends on all N input samples, and the reconstruction assumes x(t+T)=x(t)x(t+T)=x(t) If the data does not actually wrap around, that mismatch is read as a discontinuity and produces Gibbs ringing near both ends. So: perfect smoothness, but the error is spread everywhere rather than confined to one interval.

Advantages

- Infinitely smooth (C∞)
- Exact reconstruction for band-limited periodic signals
- Spectrally accurate: error decays faster than any polynomial rate for smooth periodic data
- O(N log N), efficient for large uniform datasets
- Natural choice when the analysis is already happening in the frequency domain

Disadvantages

- Requires uniformly spaced samples (no irregular x grids)
- Assumes periodicity; non-periodic data causes edge artifacts
- Gibbs ringing near jumps or sharp features
- Fully global: one bad sample contaminates the entire output
- Resamples onto a whole new grid rather than evaluating at a single arbitrary x

## REFs

[Scipy Interpolation](https://docs.scipy.org/doc/scipy/tutorial/interpolate.html) [Scipy Linear Interpolation](https://docs.scipy.org/doc/scipy/tutorial/interpolate/1D.html) [Scipy CubicSpline](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.CubicSpline.html) [Scipy PchipInterpolator](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html) [Scipy Akima1DInterpolator](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.Akima1DInterpolator.html) [Fritsch & Carlson (1980), "Monotone Piecewise Cubic Interpolation"](https://epubs.siam.org/doi/10.1137/0717021) [Akima (1970), "A New Method of Interpolation and Smooth Curve Fitting Based on Local Procedures"](https://dl.acm.org/doi/10.1145/321607.321609) [Scipy signal.resample (FFT-based resampling)](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.resample.html) [Scipy signal.resample_poly (polyphase alternative)](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.resample_poly.html) [Scipy FFT module](https://docs.scipy.org/doc/scipy/tutorial/fft.html) [Shannon (1949), "Communication in the Presence of Noise" (sampling theorem)](https://ieeexplore.ieee.org/document/1697831)

# Cal
## vector data interpolation cal

## Feature
- x = 1 column, y = 3 column (max)
- Linear method only


# Advanced (active only for allowed user)
## vector data interpolation cal

## Feature
- x = 1 column, y = no column limit
- All method (choose)
- csv import/export
- parallel computing (python base back-end)
- extrapolation
- advanced graph











