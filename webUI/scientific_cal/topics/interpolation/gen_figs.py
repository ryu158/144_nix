"""Regenerate topics/interpolation/figs/*.svg from real SciPy output.

Archived, not runnable here: flake.nix ships numpy + scipy but no matplotlib.
Add matplotlib to the flake before running. Never hand-edit the SVGs - edit
this file and re-run it.
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.interpolate import CubicSpline, PchipInterpolator, Akima1DInterpolator
from scipy.signal import resample
import os

OUT = "figs"
PREFIX = "interp_"
os.makedirs(OUT, exist_ok=True)

plt.rcParams.update({
    "figure.dpi": 110,
    "font.size": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.alpha": 0.25,
    "legend.frameon": False,
    "svg.fonttype": "none",
})

DATA = "#111111"
C_LIN = "#1f77b4"
C_CUB = "#d62728"
C_PCH = "#2ca02c"
C_AKI = "#9467bd"
C_FFT = "#ff7f0e"

# dataset with a flat run then a jump -> exposes overshoot differences
x = np.array([0, 1, 2, 3, 4, 5, 6, 7], float)
y = np.array([0, 0, 0, 1, 1, 1, 1, 1], float)
xf = np.linspace(x[0], x[-1], 600)

# simple demo data used in the intro
xs = np.array([1, 2, 3, 4, 5], float)
ys = np.array([2, 4, 3, 6, 5], float)
xsf = np.linspace(1, 5, 500)


def save(fig, name):
    fig.tight_layout()
    fig.savefig(f"{OUT}/{PREFIX}{name}.svg", format="svg", bbox_inches="tight", transparent=False)
    plt.close(fig)
    print("wrote", name)


def base(ax, xd=x, yd=y):
    ax.plot(xd, yd, "o", color=DATA, ms=6, zorder=5, label="data")


# ---------------------------------------------------------------- 00 concept
fig, ax = plt.subplots(figsize=(6.0, 3.2))
ax.plot(xs, ys, "o", color=DATA, ms=7, zorder=5, label="measured")
ax.plot(xsf, np.interp(xsf, xs, ys), "-", color=C_LIN, lw=2, label="fitted curve")
ax.plot([2.5], [np.interp(2.5, xs, ys)], "*", color="#d62728", ms=18, zorder=6,
        label="estimate at x=2.5")
ax.vlines(2.5, 0, np.interp(2.5, xs, ys), color="#d62728", ls=":", lw=1.2)
ax.set_ylim(0, 7)
ax.set_xlabel("x"); ax.set_ylabel("y")
ax.set_title("Interpolation: fill in the gap between measurements")
ax.legend(loc="upper left")
save(fig, "00_concept")

# ---------------------------------------------------------------- 01 linear
fig, axes = plt.subplots(1, 2, figsize=(8.4, 3.2))
ax = axes[0]
base(ax, xs, ys)
ax.plot(xsf, np.interp(xsf, xs, ys), "-", color=C_LIN, lw=2)
ax.set_title("Linear: connect the dots")
ax.set_xlabel("x"); ax.set_ylabel("y")

ax = axes[1]
slope = np.gradient(np.interp(xsf, xs, ys), xsf)
ax.step(xsf, slope, color=C_LIN, lw=2)
for xv in xs[1:-1]:
    ax.axvline(xv, color="#999999", ls=":", lw=1)
ax.set_title("Slope jumps at every data point")
ax.set_xlabel("x"); ax.set_ylabel("f'(x)")
save(fig, "01_linear")

# ---------------------------------------------------------------- 02 cubic
fig, axes = plt.subplots(1, 2, figsize=(8.4, 3.2))
cs = CubicSpline(x, y)
ax = axes[0]
base(ax)
ax.plot(xf, np.interp(xf, x, y), "--", color="#aaaaaa", lw=1.5, label="linear")
ax.plot(xf, cs(xf), "-", color=C_CUB, lw=2, label="cubic spline")
ax.set_ylim(-0.25, 1.35)
ax.annotate("overshoot", xy=(3.4, float(cs(3.4))), xytext=(4.9, 0.70),
            arrowprops=dict(arrowstyle="->", color=C_CUB), color=C_CUB, fontsize=9)
ax.annotate("undershoot", xy=(1.5, float(cs(1.5))), xytext=(0.15, 0.62),
            arrowprops=dict(arrowstyle="->", color=C_CUB), color=C_CUB, fontsize=9)
ax.set_title("Cubic spline: smooth, but swings past the data")
ax.set_xlabel("x"); ax.set_ylabel("y")
ax.legend(loc="upper left")

ax = axes[1]
ax.plot(xf, cs(xf, 2), "-", color=C_CUB, lw=2)
ax.axhline(0, color="#bbbbbb", lw=0.8)
ax.set_title("Curvature is continuous (C2)")
ax.set_xlabel("x"); ax.set_ylabel("f''(x)")
save(fig, "02_cubic")

# ---------------------------------------------------------------- 03 pchip
fig, ax = plt.subplots(figsize=(6.2, 3.4))
base(ax)
pc = PchipInterpolator(x, y)
ax.plot(xf, cs(xf), "--", color=C_CUB, lw=1.6, label="cubic spline")
ax.plot(xf, pc(xf), "-", color=C_PCH, lw=2.2, label="PCHIP")
ax.axhline(0, color="#bbbbbb", lw=0.8)
ax.axhline(1, color="#bbbbbb", lw=0.8)
ax.annotate("stays inside the data range", xy=(3.3, pc(3.3)), xytext=(3.9, 0.45),
            arrowprops=dict(arrowstyle="->", color=C_PCH), color=C_PCH)
ax.set_title("PCHIP: monotone data stays monotone")
ax.set_xlabel("x"); ax.set_ylabel("y")
ax.legend(loc="upper left")
save(fig, "03_pchip")

# ---------------------------------------------------------------- 04 akima
xo = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8], float)
yo = np.array([1, 1, 1, 1, 5, 1, 1, 1, 1], float)   # single outlier
xof = np.linspace(0, 8, 700)
fig, ax = plt.subplots(figsize=(6.2, 3.4))
ax.plot(xo, yo, "o", color=DATA, ms=6, zorder=5, label="data")
ax.plot(xof, CubicSpline(xo, yo)(xof), "--", color=C_CUB, lw=1.6, label="cubic spline")
ax.plot(xof, Akima1DInterpolator(xo, yo)(xof), "-", color=C_AKI, lw=2.2, label="Akima")
ax.annotate("spline rings on both sides", xy=(6.0, CubicSpline(xo, yo)(6.0)),
            xytext=(5.4, 3.4), arrowprops=dict(arrowstyle="->", color=C_CUB), color=C_CUB)
ax.set_title("Akima: one outlier stays local")
ax.set_xlabel("x"); ax.set_ylabel("y")
ax.legend(loc="upper left")
save(fig, "04_akima")

# ---------------------------------------------------------------- 05 fft interp
n = 16
tn = np.arange(n) / n
sig = np.sin(2 * np.pi * tn) + 0.4 * np.sin(6 * np.pi * tn)
up, tup = resample(sig, 512, t=tn)
tdense = np.linspace(0, 1, 512, endpoint=False)
true = np.sin(2 * np.pi * tdense) + 0.4 * np.sin(6 * np.pi * tdense)

sq = np.where(tn < 0.5, 0.0, 1.0)
upsq, _ = resample(sq, 512, t=tn)

fig, axes = plt.subplots(1, 2, figsize=(8.6, 3.3))
ax = axes[0]
ax.plot(tdense, true, color="#bbbbbb", lw=3, label="true signal")
ax.plot(tup, up, color=C_FFT, lw=1.8, label="FFT resample")
ax.plot(tn, sig, "o", color=DATA, ms=5, zorder=5, label="16 samples")
ax.set_title("Band-limited & periodic: near perfect")
ax.set_xlabel("t"); ax.legend(loc="lower left", fontsize=8)

ax = axes[1]
ax.step(np.r_[tn, 1.0], np.r_[sq, sq[-1]], where="post", color="#bbbbbb", lw=2.5,
        label="true signal")
ax.plot(tdense, upsq, color=C_FFT, lw=1.8, label="FFT resample")
ax.plot(tn, sq, "o", color=DATA, ms=5, zorder=5)
ax.annotate("Gibbs ringing", xy=(0.72, float(upsq[int(0.72 * 512)])), xytext=(0.50, 0.32),
            arrowprops=dict(arrowstyle="->", color=C_FFT), color=C_FFT)
ax.set_title("Sharp jump: ringing appears")
ax.set_xlabel("t"); ax.legend(loc="upper left", fontsize=8)
save(fig, "05_fft_interp")

# ---------------------------------------------------------------- 06 all
fig, ax = plt.subplots(figsize=(7.2, 3.8))
base(ax)
ax.plot(xf, np.interp(xf, x, y), color=C_LIN, lw=1.8, label="linear")
ax.plot(xf, cs(xf), color=C_CUB, lw=1.8, label="cubic spline")
ax.plot(xf, pc(xf), color=C_PCH, lw=1.8, label="PCHIP")
ax.plot(xf, Akima1DInterpolator(x, y)(xf), color=C_AKI, lw=1.8, label="Akima")
ax.set_title("Same data, four methods")
ax.set_xlabel("x"); ax.set_ylabel("y")
ax.legend(loc="upper left", ncol=2)
save(fig, "06_all_methods")
