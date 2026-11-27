"""NOVYRA Cinematic Reveal – originales Sounddesign (100 % eigene Synthese, lizenzfrei).

Alle Ereignisse sind auf die Animation synchronisiert (Zeiten in Sekunden).
Ausgabe: build/sound.wav (48 kHz, Stereo, -14 LUFS nach Mastering in render.sh)
"""
import pathlib
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
DUR = 18.0
N = int(DUR * SR)
rng = np.random.default_rng(42)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def bp(x, a, b, o=2):
    return sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x)


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if sig.ndim == 1:
        sig = np.stack([sig * np.cos((pan + 1) * np.pi / 4) * 1.414, sig * np.sin((pan + 1) * np.pi / 4) * 1.414], 1)
    if i < 0:
        sig = sig[-i:]
        i = 0
    L = min(len(sig), len(buf) - i)
    if L > 0:
        buf[i:i + L] += sig[:L] * gain


def reverb(x, decay=2.5, mix=0.35, seed=1):
    r = np.random.default_rng(seed)
    n = int(decay * SR)
    env = np.exp(-6.9 * np.arange(n) / n)
    mono = x if x.ndim == 1 else x.mean(1)
    out = np.zeros((len(mono) + n - 1, 2))
    for c in range(2):
        ir = lp(r.standard_normal(n) * env, 7000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, c] = fftconvolve(mono, ir) * mix
    dry = np.stack([mono, mono], 1)
    out[:len(dry)] += dry * (1 - mix * 0.4)
    return out


def sub_boom(d=3.0, f0=70, f1=28, click=0.6):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t * 5)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3)
    tr = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 40) * click
    return np.tanh(1.8 * (body + tr)) * 0.9


def impact(d=2.5, f0=110, f1=40, bright=1.0):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t * 9)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    noise = bp(rng.standard_normal(len(t)), 900, 9000) * np.exp(-t * 7) * 0.5 * bright
    metal = sum(np.sin(2 * np.pi * fr * t + k) * np.exp(-t * (3 + k)) for k, fr in enumerate([1180, 1730, 2410, 3320])) * 0.08 * bright
    return np.tanh(1.5 * (body + noise + metal))


def whoosh(d=0.9, up=True, lo=200, hi=7000):
    t = tt(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    B = 28
    for b in range(B):
        i0, i1 = b * len(t) // B, (b + 1) * len(t) // B
        p = b / B if up else 1 - b / B
        fc = lo * (hi / lo) ** p
        seg = bp(n[max(0, i0 - 2400):i1], fc * 0.6, min(fc * 1.6, 20000))[-(i1 - i0):]
        out[i0:i1] = seg
    return out * np.sin(np.pi * t / d) ** 2 * 1.4


def riser(d):
    t = tt(d)
    f = 90 * 2 ** (5 * (t / d) ** 1.6)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.498) / SR)
    noise = hp(rng.standard_normal(len(t)), 1500) * (t / d) ** 2.5
    return (tone * 0.3 + noise * 0.45) * (t / d) ** 2


def shimmer(d=2.0, base=1760):
    t = tt(d)
    out = sum(np.sin(2 * np.pi * base * r * t + k) * np.exp(-t * (1.2 + k * 0.4)) * (0.6 + 0.4 * np.sin(2 * np.pi * (6 + k) * t)) for k, r in enumerate([1, 1.26, 1.5, 2, 2.52]))
    return out * np.minimum(1, t / 0.05) * 0.12


def blip(f=1500, d=0.08):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 55) * 0.5


def tick(f=4000):
    t = tt(0.03)
    return bp(rng.standard_normal(len(t)), f * 0.7, f * 1.3) * np.exp(-t * 200) * 1.2


def glitter(d=1.5, n=140):
    out = np.zeros(int(d * SR))
    for i in range(n):
        at = (i / n) ** 0.8 * d * 0.95
        b = blip(2500 + rng.uniform(0, 4500), 0.05) * rng.uniform(0.1, 0.35)
        j = int(at * SR)
        out[j:j + len(b)] += b[: len(out) - j]
    return out


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


sfx = np.zeros((N, 2))
# --- 0–3 s Hook
drone_t = tt(3.4)
drone = (np.sin(2 * np.pi * 41.2 * drone_t) + 0.5 * np.sin(2 * np.pi * 61.7 * drone_t)) * np.minimum(1, drone_t / 1.2) * np.minimum(1, (3.4 - drone_t) / 0.4)
place(sfx, lp(drone, 200) * 0.5, 0.0)
place(sfx, sub_boom(3.0, 60, 26, 0.3), 0.05, 0.9)
place(sfx, reverb(shimmer(2.5, 1318), 2.5, 0.5), 0.3, 0.6)
for i in range(15):
    place(sfx, tick(3000 + (i % 5) * 600), 0.55 + i * 0.035, 0.18, pan=(i % 2 - 0.5) * 0.6)
place(sfx, reverb(impact(2.0, 120, 45, 0.6), 2.2, 0.4), 0.95, 0.65)
place(sfx, riser(0.8), 2.15, 0.7)
place(sfx, whoosh(0.9, True, 150, 9000), 2.15, 0.8)
place(sfx, reverb(sub_boom(2.6, 90, 30, 1.0), 2.6, 0.45), 2.95, 1.0)
# --- 3–7 s ERP
for i in range(8):
    place(sfx, blip(900 + i * 140, 0.09), 3.05 + 0.08 * i, 0.35, pan=(i % 3 - 1) * 0.5)
    place(sfx, whoosh(0.35, True, 800, 9000), 3.0 + 0.08 * i, 0.12, pan=(i % 3 - 1) * 0.5)
place(sfx, reverb(impact(1.8, 130, 50, 0.7), 2.0, 0.35), 3.75, 0.7)
for k in range(14):
    place(sfx, tick(5200), 4.2 + k * 0.17, 0.12, pan=(k % 2 - 0.5) * 0.8)
place(sfx, whoosh(0.8, True, 300, 10000), 6.4, 0.75)
# --- 7–11 s Web
place(sfx, reverb(impact(2.2, 100, 42, 1.0), 2.4, 0.4), 6.98, 0.85)
place(sfx, reverb(shimmer(1.6, 2093), 2.0, 0.5), 7.0, 0.7)
place(sfx, reverb(impact(1.8, 130, 50, 0.6), 2.0, 0.35), 7.7, 0.6)
place(sfx, whoosh(1.6, False, 200, 3000), 8.2, 0.25, pan=-0.5)
place(sfx, whoosh(1.6, True, 200, 3000), 9.4, 0.25, pan=0.5)
place(sfx, whoosh(0.9, True, 300, 10000), 10.15, 0.75)
# --- 11–14 s Netzwerk: Impacts exakt auf die Wörter
place(sfx, reverb(whoosh(0.6, False, 400, 9000), 1.0, 0.3), 10.95, 0.6)
for at in [11.3, 12.3, 13.3]:
    place(sfx, riser(0.28) * 0.6, at - 0.28, 0.6)
    place(sfx, reverb(impact(2.5, 120, 36, 1.0), 2.6, 0.42), at, 1.0)
    place(sfx, reverb(sub_boom(1.6, 80, 32, 0.5), 1.8, 0.3), at, 0.6)
for k in range(24):
    place(sfx, blip(1800 + (k * 377) % 2400, 0.05), 11.05 + k * 0.12, 0.12, pan=((k * 7) % 5 - 2) * 0.3)
# --- 14–18 s Reveal
place(sfx, riser(0.6), 13.72, 0.8)
place(sfx, whoosh(0.6, False, 400, 9000), 13.75, 0.5)
place(sfx, reverb(sub_boom(4.2, 75, 24, 1.2), 3.8, 0.5), 14.28, 1.0)
place(sfx, reverb(impact(3.5, 95, 30, 1.2), 3.8, 0.5), 14.28, 0.9)
place(sfx, reverb(glitter(1.4), 1.8, 0.5), 14.4, 0.7)
place(sfx, reverb(shimmer(3.0, 1046), 3.0, 0.55), 15.45, 0.9)
place(sfx, reverb(impact(2.5, 160, 70, 0.4), 2.8, 0.45), 15.5, 0.55)
place(sfx, reverb(shimmer(1.5, 2637), 1.8, 0.5), 15.95, 0.5)
for at, f in [(15.95, 1320), (16.4, 1568), (16.85, 1760)]:
    place(sfx, reverb(blip(f, 0.25), 1.6, 0.5), at, 0.5)

# --- Musik: subtile Elektronik, 120 BPM, Raster ab 0,3 s (Impacts auf den Zählzeiten)
music = np.zeros((N, 2))
beat = 0.5
grid0 = 0.3
CH = [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]]  # Am – F – G – Em (weit gestimmt)
t_all = np.arange(N) / SR
# Pad (warme, breite Flächen), gefiltert öffnend
for ci in range(9):
    t0 = ci * 2.0
    seg = tt(2.6)
    env = np.minimum(1, seg / 0.6) * np.minimum(1, np.maximum(0, (2.6 - seg) / 0.6))
    for c in range(2):
        s = sum(np.sin(2 * np.pi * note(m) * (1 + (0.003 if c else -0.003)) * h * seg + h) / h ** 1.4 for m in CH[ci % 4] for h in (1, 2, 3))
        place(music, np.stack([s * env * (c == 0), s * env * (c == 1)], 1) * 0.018, t0)
music = np.stack([lp(music[:, 0], 1400), lp(music[:, 1], 1400)], 1)


def curve(points):
    xs, ys = zip(*points)
    return np.interp(t_all, xs, ys)


arp_lvl = curve([(0, 0), (2.9, 0), (3.0, 0.5), (6.9, 0.6), (7.0, 0.7), (10.9, 0.8), (11.0, 1.0), (13.9, 1.0), (14.1, 0), (15.4, 0), (15.6, 0.45), (18, 0.3)])
kick_lvl = curve([(0, 0), (2.94, 0), (2.95, 0.55), (6.9, 0.6), (7.0, 0.75), (13.9, 0.95), (14.0, 0), (18, 0)])
k = 0
arp = np.zeros((N, 2))
pat = [0, 2, 1, 3, 2, 1, 3, 2]
while grid0 + k * beat / 4 < DUR:
    t0 = grid0 + k * beat / 4
    lv = arp_lvl[min(int(t0 * SR), N - 1)]
    if lv > 0.01:
        ch = CH[int(t0 / 2.0) % 4]
        f = note(ch[pat[k % 8]] + 12)
        seg = tt(0.3)
        s = (np.sin(2 * np.pi * f * seg) + 0.3 * np.sign(np.sin(2 * np.pi * f * 2 * seg)) * 0.3) * np.exp(-seg * 18)
        place(arp, lp(s, 4000) * lv * 0.07, t0, pan=-0.4 if k % 2 else 0.4)
    k += 1
dl = int(0.375 * SR)
arp[dl:, 0] += arp[:-dl, 1] * 0.4
arp[dl:, 1] += arp[:-dl, 0] * 0.3
music += arp
k = 0
while grid0 + k * beat < DUR:
    t0 = grid0 + k * beat
    lv = kick_lvl[min(int(t0 * SR), N - 1)]
    if lv > 0.01:
        seg = tt(0.4)
        f = 42 + 120 * np.exp(-seg * 32)
        place(music, np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-seg * 8) * 2.2) * lv * 0.42, t0)
        hh = hp(rng.standard_normal(int(0.05 * SR)), 8000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 70)
        place(music, hh * lv * 0.1, t0 + beat / 2, pan=0.25)
    k += 1
# Finaler Akkord (episch) ab dem Logo
seg = tt(3.7)
fin = sum(np.sin(2 * np.pi * note(m) * h * seg) / h ** 1.2 for m in [33, 45, 52, 57, 64, 69] for h in (1, 2)) * np.minimum(1, seg / 0.1) * np.exp(-seg * 0.55)
place(music, lp(fin, 3000) * 0.05, 14.3)
music = reverb(music, 2.8, 0.25, seed=3)[:N]
mix = sfx * 0.9 + music
mix *= np.minimum(1, (DUR - t_all) / 0.5)[:, None]
mix /= max(1e-9, np.abs(mix).max()) / 0.95
(ROOT / "build").mkdir(exist_ok=True)
wavfile.write(ROOT / "build" / "sound.wav", SR, (mix * 32767).astype(np.int16))
print("ok", DUR)
