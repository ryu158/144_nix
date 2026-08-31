bb## What is the Fourier Transform

Suppose you have a uniformly sampled signal: (t_1,x_1), (t_2,x_2), ... , (t_n,x_n) but what you actually care about is not the values themselves, it is _which frequencies_ the signal is made of.

For example:

```
sampled at 8 Hz:
t = 0.000  0.125  0.250  0.375  0.500  0.625  0.750  0.875
x = 0.00   0.71   1.00   0.71   0.00  -0.71  -1.00  -0.71

want:
"this is a 1 Hz sine, amplitude 1"

```

The Discrete Fourier Transform constructs a set of coefficients Xk=∑n=0N−1xne−2πikn/NX_k = \sum_{n=0}^{N-1} x_n e^{-2\pi i kn/N} that express the same N samples as a sum of N complex sinusoids. The inverse xn=1N∑k=0N−1Xke2πikn/Nx_n = \frac{1}{N}\sum_{k=0}^{N-1} X_k e^{2\pi i kn/N} rebuilds the original samples exactly. Nothing is lost, the data is just written in a different basis.

The Fast Fourier Transform (FFT) is not a different transform. It is a family of algorithms that compute the _same_ DFT much faster by exploiting structure in the twiddle factors WN=e−2πi/NW_N = e^{-2\pi i/N}

## Methods

How do we actually compute those N coefficients? We can implement each of these ideas in python via the Scipy library (`scipy.fft`), which wraps pocketfft and selects the algorithm automatically based on N. There is 5 major categories: naive DFT, Cooley–Tukey radix-2, mixed-radix/split-radix, Rader, and Bluestein/chirp-z

## Naive DFT

Basic idea Evaluate the definition directly. For each output index k, loop over all N input samples and accumulate. Xk=∑n=0N−1xnWNknX_k = \sum_{n=0}^{N-1} x_n W_N^{kn} Written as a matrix product this is X=FNxX = F_N x where FNF_N is the N×N DFT matrix with entries (FN)k,n=WNkn(F_N)_{k,n} = W_N^{kn}

Important characteristic The cost is O(N2)O(N^2) complex multiply-adds, because every one of the N outputs touches every one of the N inputs. There is no restriction on N and no recursion, which makes it the reference implementation everything else is checked against. Rounding error also accumulates over a single long sum per output, so error grows roughly like O(N)O(\sqrt{N}) rather than the much gentler growth of the recursive methods.

Advantages

- Trivially simple
- Works for any N
- Easy to verify and to reason about
- Easy to modify (e.g. compute only a few bins of interest)
- No memory reordering or bit-reversal bookkeeping

Disadvantages

- O(N²): unusable beyond a few thousand samples
- Worse numerical error accumulation than FFT algorithms
- Recomputes the same twiddle factors repeatedly
- Poor cache behavior for large N

## Cooley–Tukey radix-2 FFT

Basic idea Split the input into even-indexed and odd-indexed samples, transform each half separately, then recombine. Writing Ek=DFTN/2(x2n),Ok=DFTN/2(x2n+1)E_k = \mathrm{DFT}_{N/2}(x_{2n}),\quad O_k = \mathrm{DFT}_{N/2}(x_{2n+1}) the two halves of the output are Xk=Ek+WNkOkX_k = E_k + W_N^k O_k Xk+N/2=Ek−WNkOkX_{k+N/2} = E_k - W_N^k O_k for k = 0 … N/2 − 1. This pairing is the _butterfly_. Applying the split recursively until the subproblems are length 1 gives the classic radix-2 decimation-in-time algorithm.

Important characteristic The recursion has depth log2N\log_2 N with O(N) work per level, so the total cost drops to O(Nlog⁡N)O(N\log N) The catch is that N must be a power of two. The recursive splitting also permutes the input into bit-reversed order, so a real implementation either reorders up front or accepts scrambled output. Error growth improves to roughly O(log⁡N)O(\sqrt{\log N}) because each value passes through only log N additions instead of N.

Advantages

- O(N log N): the reason FFTs are everywhere
- Simple, regular butterfly structure
- Maps cleanly onto hardware and SIMD
- Can run in-place with O(1) extra memory
- Better numerical accuracy than the naive sum

Disadvantages

- Requires N to be a power of two
- Needs bit-reversal permutation (extra pass, cache-unfriendly)
- Zero-padding to the next power of two changes the frequency grid
- Not the lowest possible operation count (split-radix beats it)

## Mixed-radix and split-radix FFT

Basic idea Generalize the even/odd split to any factorization. If N=N1N2N = N_1 N_2 reindex the samples as a N1×N2N_1 \times N_2 array, transform along one axis, multiply by twiddle factors, then transform along the other: Xk1+N1k2=∑n1=0N1−1[WNn1k2∑n2=0N2−1xn2N1+n1WN2n2k2]WN1n1k1X_{k_1+N_1k_2} = \sum_{n_1=0}^{N_1-1}\left[W_N^{n_1k_2}\sum_{n_2=0}^{N_2-1}x_{n_2N_1+n_1}W_{N_2}^{n_2k_2}\right]W_{N_1}^{n_1k_1} Split-radix is the special case that interleaves a radix-2 split on the even part with a radix-4 split on the odd parts, which removes many trivial multiplications by ±1,±i\pm 1, \pm i

Important characteristic Cost stays O(Nlog⁡N)O(N\log N) but N is now only required to be _composite_ with small prime factors, which is why libraries advertise fast paths for N built from 2, 3, 5, 7. Split-radix holds the lowest known arithmetic operation count for power-of-two lengths, around 4Nlog⁡2N4N\log_2 N real flops versus roughly 5Nlog⁡2N5N\log_2 N for radix-2. This is the family that `scipy.fft` actually dispatches to for most practical lengths.

Advantages

- Works for any smooth (small-prime-factor) N, not just powers of two
- Lowest known operation count for power-of-two N (split-radix)
- Avoids padding artifacts by supporting more usable lengths
- Cache-friendly variants map well to the four-step/six-step formulations

Disadvantages

- Considerably more complex to implement correctly
- Performance is uneven: degrades sharply if N has a large prime factor
- More twiddle-factor tables to store
- Irregular butterfly structure is harder to vectorize by hand

## Rader's algorithm

Basic idea Handle prime N, where no factorization exists, by turning the DFT into a convolution. For prime N there is a primitive root g modulo N, so the nonzero indices can be relabeled as powers of g: n=gp,k=gqmod Nn = g^p,\quad k = g^{q} \mod N Under that relabeling the exponent knk n becomes a difference p+qp+q and the transform of the nonzero bins turns into a cyclic convolution of length N − 1: Xgq−x0=∑p=0N−2xgp WNgp+qX_{g^{q}} - x_0 = \sum_{p=0}^{N-2} x_{g^p},W_N^{g^{p+q}} That convolution is then evaluated with two FFTs and a pointwise product, using any convenient length ≥ N − 1.

Important characteristic Since N − 1 is even and usually composite, the inner FFTs are fast, so a prime-length DFT still costs O(Nlog⁡N)O(N\log N) instead of falling back to O(N2)O(N^2) The constant factor is noticeably larger than a plain Cooley–Tukey pass, and the algorithm needs the primitive root and index tables precomputed.

Advantages

- Makes prime-length transforms O(N log N)
- Exact, no approximation involved
- Reuses existing FFT machinery for the convolution
- Good constant factor for moderate primes

Disadvantages

- Only applies to prime N
- Requires finding a primitive root and building index permutation tables
- Extra memory for the reindexed sequences
- Higher constant factor and worse cache behavior than a direct radix pass

## Bluestein / chirp-z algorithm

Basic idea Handle _any_ N, prime or not, with a single trick: rewrite the exponent product as a difference of squares. kn=n2+k2−(k−n)22kn = \frac{n^2 + k^2 - (k-n)^2}{2} Substituting into the DFT gives Xk=WNk2/2∑n=0N−1(xnWNn2/2) WN−(k−n)2/2X_k = W_N^{k^2/2}\sum_{n=0}^{N-1}\left(x_n W_N^{n^2/2}\right),W_N^{-(k-n)^2/2} which is a linear convolution between the chirp-modulated input and a fixed chirp kernel. Zero-pad both to any convenient length M ≥ 2N − 1 (typically the next power of two), convolve with three fast FFTs, then demodulate.

Important characteristic Cost is O(Nlog⁡N)O(N\log N) for arbitrary N, including large primes, with no factorization required at all. The price is three transforms of length M ≈ 2N instead of one of length N, plus the chirp tables. Because the kernel involves WNn2/2W_N^{n^2/2} with n² growing quickly, careful modular reduction of the exponent is needed to keep accuracy; a naive implementation loses precision for large N. The same machinery generalizes to the chirp-z transform, which evaluates the z-transform along an arbitrary spiral contour rather than only on the unit circle.

Advantages

- Works for absolutely any N
- O(N log N) even for large prime lengths
- No primitive root or index tables needed
- Generalizes to arbitrary frequency ranges and resolutions (zoom FFT)

Disadvantages

- Roughly 3× the work of a comparable radix FFT
- Needs O(M) extra memory for padded buffers and chirp tables
- Accuracy sensitive to how the chirp exponents are computed
- Rarely the fastest choice when N is smooth

## A note on the frequency grid

Whichever algorithm runs underneath, the output grid is the same. For N samples taken at rate fsf_s bin k corresponds to fk=kfsN,k=0,…,N/2f_k = \frac{k f_s}{N},\quad k = 0,\dots,N/2 so the resolution is Δf=fs/N\Delta f = f_s/N and the highest representable frequency is the Nyquist limit fs/2f_s/2 Two consequences follow directly, and both are properties of the DFT rather than of any FFT algorithm:

- **Aliasing.** Content above Nyquist folds back into the visible band and is indistinguishable from a lower frequency. Filter before sampling, not after.
- **Spectral leakage.** The DFT assumes the N samples are one exact period. If they are not, the discontinuity at the wrap point spreads energy across all bins. Applying a window (Hann, Hamming, Blackman) tapers the ends and suppresses the sidelobes, at the cost of a slightly wider main lobe.

For real-valued input, use `scipy.fft.rfft` rather than `fft`: the spectrum is conjugate-symmetric, so only N/2 + 1 bins carry information and the transform runs about twice as fast in half the memory.

## REFs

[Scipy FFT tutorial](https://docs.scipy.org/doc/scipy/tutorial/fft.html) [Scipy fft module reference](https://docs.scipy.org/doc/scipy/reference/fft.html) [Scipy fft.rfft (real-input transform)](https://docs.scipy.org/doc/scipy/reference/generated/scipy.fft.rfft.html) [Scipy signal.get_window (windowing functions)](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.get_window.html) [Cooley & Tukey (1965), "An Algorithm for the Machine Calculation of Complex Fourier Series"](https://www.ams.org/journals/mcom/1965-19-090/S0025-5718-1965-0178586-1/) [Rader (1968), "Discrete Fourier Transforms When the Number of Data Samples Is Prime"](https://ieeexplore.ieee.org/document/1448407) [Bluestein (1970), "A Linear Filtering Approach to the Computation of Discrete Fourier Transform"](https://ieeexplore.ieee.org/document/1162132) [Duhamel & Vetterli (1990), "Fast Fourier Transforms: A Tutorial Review and a State of the Art"](https://www.sciencedirect.com/science/article/abs/pii/016516849090158U) [Harris (1978), "On the Use of Windows for Harmonic Analysis with the DFT"](https://ieeexplore.ieee.org/document/1455106) [FFTW: implementation notes on algorithm selection](https://www.fftw.org/fftw3_doc/)