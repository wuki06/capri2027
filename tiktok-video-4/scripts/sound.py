"""Domino-Rätsel: synthetisiert Musik + Soundeffekte (100 % eigene Klangsynthese, lizenzfrei).

Ausgabe: build/music.wav, build/sfx.wav, build/voice.wav (48 kHz Stereo)
"""
import json, pathlib
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "build" / "timeline.json").read_text())
SR = 48000
TOTAL = TL["total"] + 0.5
N = int(TOTAL * SR)
rng = np.random.default_rng(7)
ev = TL["events"]
scenes = {s["id"]: s for s in TL["scenes"]}
lines = {l["id"]: l for l in TL["lines"]}


def word_at(lid, match):
    ws = [w for w in lines[lid]["words"] if match.lower() in w["w"].lower()]
    return ws[0]["s"]


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= buf.shape[0] or i + len(sig) <= 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[: buf.shape[0] - i]
    l = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    r = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    if sig.ndim == 1:
        buf[i : i + len(sig), 0] += sig * gain * l
        buf[i : i + len(sig), 1] += sig * gain * r
    else:
        buf[i : i + len(sig)] += sig * gain


def reverb(x, decay=2.2, mix=0.3, seed=1):
    r = np.random.default_rng(seed)
    n = int(decay * SR)
    env = np.exp(-6.9 * np.arange(n) / n)
    out = np.zeros((len(x) + n - 1, 2))
    mono = x if x.ndim == 1 else x.mean(axis=1)
    for c in range(2):
        ir = lp(r.standard_normal(n) * env, 6000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, c] = fftconvolve(mono, ir) * mix
    dry = x if x.ndim == 2 else np.stack([x, x], 1)
    out[: len(dry)] += dry * (1 - mix * 0.5)
    return out


def adsr(n, a=0.01, d=0.1, s=0.6, r=0.2, length=None):
    length = length or n / SR
    t = np.arange(n) / SR
    env = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel_start = max(length - r, a + d)
    env = np.where(t > rel_start, env * np.clip(1 - (t - rel_start) / r, 0, 1), env)
    return env


# --- Soundeffekte -------------------------------------------------------------
def boom(d=2.5, f0=90, f1=32, noise=0.5):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 1.6)
    click = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 30) * noise
    crash = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 3.5) * 0.25 * noise
    return np.tanh(1.6 * (body + click + crash)) * 0.9


def whoosh(d=0.9, up=True):
    t = tt(d)
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / d) ** 2
    out = np.zeros_like(n)
    # zeitvariable Bandpass-Sweeps in Blöcken
    blocks = 24
    for b in range(blocks):
        i0, i1 = b * len(t) // blocks, (b + 1) * len(t) // blocks
        p = b / blocks if up else 1 - b / blocks
        fc = 300 * (2 ** (5 * p))
        seg = bp(n[max(0, i0 - 2000) : i1], fc * 0.6, min(fc * 1.6, 20000))[-(i1 - i0) :]
        out[i0:i1] = seg
    return out * env * 1.4


def riser(d):
    t = tt(d)
    f = 120 * 2 ** (4 * (t / d) ** 1.5)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    noise = hp(rng.standard_normal(len(t)), 800) * (t / d) ** 2
    env = (t / d) ** 2.2
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * (2 + 14 * (t / d) ** 2) * t)
    return (tone * 0.35 + noise * 0.5) * env * trem


def blip(f=1200, d=0.09, slide=1.0):
    t = tt(d)
    ff = f * (1 + (slide - 1) * t / d)
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 40) * 0.6


def tick(f=3200):
    t = tt(0.03)
    return bp(rng.standard_normal(len(t)), f * 0.7, f * 1.3) * np.exp(-t * 180) * 1.5


def glitch(d=0.75):
    t = tt(d)
    out = np.zeros(len(t))
    i = 0
    while i < len(t):
        L = int(rng.uniform(0.015, 0.07) * SR)
        kind = rng.integers(0, 3)
        seg_t = np.arange(min(L, len(t) - i)) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(80, 1600) * seg_t))
        elif kind == 1:
            s = np.round(rng.standard_normal(len(seg_t)) * 3) / 3
        else:
            s = np.zeros(len(seg_t))
        out[i : i + len(seg_t)] = s * rng.uniform(0.3, 0.9)
        i += len(seg_t)
    return lp(out, 7000) * 0.45


def zap():
    t = tt(0.6)
    f = 2400 * np.exp(-t * 7) + 120
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * 0.5


def shimmer(d=2.0):
    t = tt(d)
    out = np.zeros(len(t))
    for k, f in enumerate([1760, 2217, 2637, 3520, 4434]):
        out += np.sin(2 * np.pi * f * t + k) * np.exp(-t * (1.5 + k * 0.3)) * (0.5 + 0.5 * np.sin(2 * np.pi * (5 + k) * t))
    return out * np.minimum(1, t / 0.08) * 0.12



def scratch():
    t = tt(0.45)
    f = 900 * np.exp(-t * 6) * (1 + 0.6 * np.sin(2 * np.pi * 11 * t))
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + bp(rng.standard_normal(len(t)), 600, 3000) * 0.6
    return lp(s, 5000) * np.exp(-t * 4) * 0.8


def beep(f, d=0.22):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.005) * np.exp(-t * 6) * 0.6


def snare_roll(d):
    out = np.zeros(int(d * SR))
    k = 0.0
    while k < d:
        frac = k / d
        hit = hp(rng.standard_normal(int(0.05 * SR)), 1500) * np.exp(-np.arange(int(0.05 * SR)) / SR * 70)
        i = int(k * SR)
        L = min(len(hit), len(out) - i)
        out[i:i + L] += hit[:L] * (0.25 + 0.75 * frac ** 1.5)
        k += 0.09 - 0.055 * frac
    return out * 0.7


def rumble(d, lvl):
    t = tt(d)
    n = lp(rng.standard_normal(len(t)), 260) * 2.5
    return n * lvl[: len(t)]


def crowd(d=3.0):
    t = tt(d)
    s = np.zeros(len(t))
    for k in range(10):
        s += bp(rng.standard_normal(len(t)), 300 + k * 140, 900 + k * 240) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.5 + k * 0.3) * t + k))
    return s * np.minimum(1, t / 0.15) * np.exp(-t * 0.9) * 0.25


sfx = np.zeros((N, 2))
ev = TL["events"]
T_ = ev["T"]


def idx_to_sim(f):
    i = max(1, min(len(T_) - 1, int(np.floor(f))))
    return T_[i - 1] + (f - i) * (T_[i] - T_[i - 1])


def sim_to_video(sim):
    keys = ev["chainKeys"]
    if sim <= T_[27]:
        ts = np.linspace(keys[0][0], keys[-1][0], 4000)
        sims = [idx_to_sim(np.interp(x, [k[0] for k in keys], [k[1] for k in keys])) for x in ts]
        return float(np.interp(sim, sims, ts))
    return ev["finalStart"] + (sim - T_[27]) / ev["finalSpeed"]


def clack(size):
    # size 0..1: kleiner Klick -> tiefer Donner
    if size < 0.45:
        f = 5200 - size * 7000
        t = tt(0.06)
        s = bp(rng.standard_normal(len(t)), f * 0.6, f * 1.4) * np.exp(-t * 90) * 1.6
        s += np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t * 120) * 0.6
        return s
    return boom(1.2 + size * 2.5, 160 - size * 110, 60 - size * 30, 0.4 + size)


place(sfx, reverb(boom(2.0, 110, 34, 0.5), 2.5, 0.35), 0.0, 0.7)
tease = word_at("h2", "umwerfen")
place(sfx, whoosh(0.8), tease - 0.7, 0.5)
place(sfx, reverb(boom(2.5, 90, 30, 1.0), 2.8, 0.4), tease, 0.9)
place(sfx, reverb(boom(0.9, 120, 45, 0.5), 1.2, 0.3), word_at("h3", "Ende"), 0.45)
for sid in ["rule", "riddle", "reveal", "twist", "outro"]:
    place(sfx, whoosh(0.8), scenes[sid]["start"] - 0.4, 0.35)
place(sfx, blip(900, 0.18, 1.5), lines["u1"]["start"], 0.5)
place(sfx, blip(1200, 0.18, 1.5), lines["u2"]["start"], 0.5)
place(sfx, riser(lines["q2"]["start"] + 0.5 - lines["q1"]["start"]), lines["q1"]["start"], 0.45)
place(sfx, reverb(boom(1.0, 110, 45, 0.5), 1.4, 0.3), lines["q2"]["start"] + 0.5, 0.5)
for k, w in enumerate(["Hundert", "Tausend", "Million"]):
    place(sfx, blip(700 + k * 250, 0.12, 1.3), word_at("q2", w), 0.45)
place(sfx, beep(1320, 0.4), ev["chainStart"], 0.6)
place(sfx, whoosh(0.6), ev["chainStart"] - 0.2, 0.5)
# Aufprall jedes Steins auf den nächsten (= Start des nächsten)
for i in range(1, 29):
    tv = sim_to_video(T_[i])
    if ev["freeze"] - 0.02 <= tv < ev["finalStart"]:
        tv = ev["freeze"]
    size = i / 28
    place(sfx, clack(size), tv, 0.35 + 0.5 * size, pan=(0.3 if i % 2 else -0.3) * (1 - size))
# Freeze
place(sfx, scratch(), ev["freeze"] - 0.05, 0.9)
for k in range(4):
    place(sfx, blip(600 + k * 200, 0.14, 1.2), lines["s2"]["start"] + 0.3 + k * 0.45, 0.45)
hb = ev["freeze"] + 0.6
while hb < ev["finalStart"] - 0.3:
    for off, g in [(0, 1.0), (0.22, 0.6)]:
        tb = tt(0.25)
        place(sfx, np.sin(2 * np.pi * 50 * tb) * np.exp(-tb * 18), hb + off, 0.9 * g)
    hb += 0.8
# Finale: Riser -> gewaltiger Aufprall
place(sfx, riser(ev["impact"] - ev["finalStart"]), ev["finalStart"], 0.55)
d_ = ev["impact"] - ev["finalStart"]
cr = np.arange(int(d_ * SR)) / SR
place(sfx, lp(rng.standard_normal(len(cr)), 300) * (cr / d_) ** 2 * 2.0, ev["finalStart"], 0.5)
place(sfx, reverb(boom(5.0, 80, 24, 1.6), 3.8, 0.5), ev["impact"], 1.0)
dust = np.arange(int(4.0 * SR)) / SR
place(sfx, lp(rng.standard_normal(len(dust)), 900) * np.exp(-dust * 0.8) * 0.8, ev["impact"] + 0.05, 0.6)
place(sfx, crowd(3.5), ev["impact"] + 0.6, 0.7)
place(sfx, shimmer(3.0), lines["r1"]["start"], 1.0)
place(sfx, blip(1000, 0.2, 1.4), word_at("r2", "Millimetern"), 0.5)
place(sfx, shimmer(2.5), scenes["twist"]["start"] + 0.1, 0.9)
place(sfx, riser(1.2), word_at("t1", "63") - 0.2, 0.4)
place(sfx, reverb(boom(1.4, 100, 40, 0.6), 1.8, 0.35), word_at("t1", "Mond"), 0.6)
place(sfx, blip(660, 0.18, 1.5), word_at("o1", "Kommentare"), 0.6)

# --- Musik --------------------------------------------------------------------
def note(m):
    return 440 * 2 ** ((m - 69) / 12)


BPM = 110
beat = 60 / BPM
bar = 4 * beat
CHORDS = [[40, 43, 47], [36, 40, 43], [43, 47, 50], [38, 42, 45]]  # Em C G D


music = np.zeros((N, 2))
t_all = np.arange(N) / SR
pad = np.zeros((N, 2))
chord_len = 2 * bar
for ci in range(int(TOTAL / chord_len) + 1):
    t0 = ci * chord_len
    ch = CHORDS[ci % 4]
    seg = tt(chord_len + 1.0)
    env = np.minimum(1, seg / 0.8) * np.minimum(1, np.maximum(0, (chord_len + 1.0 - seg) / 1.0))
    for c in range(2):
        s = np.zeros(len(seg))
        for m in ch + [ch[0] + 12]:
            for det in (-0.12, 0.12):
                f = note(m) * 2 ** ((det + (0.05 if c else -0.05)) / 12)
                for h in range(1, 7):
                    s += np.sin(2 * np.pi * f * h * seg + h * c) / h ** 1.3
        s = lp(s, 900) * env
        i = int(t0 * SR)
        L = min(len(s), N - i)
        if L > 0:
            pad[i:i + L, c] += s[:L] * 0.035


def curve(points):
    xs, ys = zip(*points)
    return np.interp(t_all, xs, ys)


S_ = scenes
fz, fs_, im = ev["freeze"], ev["finalStart"], ev["impact"]
cs = ev["chainStart"]
pad_lvl = curve([(0, 1), (TOTAL, 1)])
bass_lvl = curve([(0, 0.3), (S_["riddle"]["start"], 0.6), (cs - 0.01, 0.6), (cs, 1), (fz - 0.01, 1), (fz, 0), (im - 0.01, 0), (im + 0.5, 1), (S_["twist"]["start"], 0.4), (S_["outro"]["start"], 0.8), (TOTAL, 0.8)])
arp_lvl = curve([(0, 0.35), (S_["riddle"]["start"], 0.6), (cs, 0.9), (fz - 0.01, 1), (fz, 0), (fs_, 0), (fs_ + 0.2, 0.5), (im - 0.01, 0.9), (im + 0.5, 1), (S_["twist"]["start"], 0.5), (TOTAL, 0.7)])
kick_lvl = curve([(0, 0), (cs - 0.01, 0), (cs, 0.7), (fz - 0.01, 1), (fz, 0), (im + 0.49, 0), (im + 0.5, 1), (S_["twist"]["start"], 0), (S_["outro"]["start"], 0.7), (TOTAL, 0.7)])
music += pad * pad_lvl[:, None]

n8 = beat / 2
k = 0
while k * n8 < TOTAL:
    t0 = k * n8
    ch = CHORDS[int(t0 / chord_len) % 4]
    seg = tt(n8 * 0.95)
    f = note(ch[0] - 12)
    s = (np.sin(2 * np.pi * f * seg) + 0.3 * np.sin(2 * np.pi * 2 * f * seg)) * np.exp(-seg * 7) * np.minimum(1, seg / 0.005)
    lv = bass_lvl[min(int(t0 * SR), N - 1)]
    if lv > 0.01:
        place(music, s * lv * 0.22, t0)
    k += 1

n16 = beat / 4
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
k = 0
arp = np.zeros((N, 2))
while k * n16 < TOTAL:
    t0 = k * n16
    ch = CHORDS[int(t0 / chord_len) % 4]
    tones = ch + [ch[0] + 12]
    m = tones[pattern[k % 8]] + 12
    seg = tt(0.35)
    f = note(m)
    s = (np.sin(2 * np.pi * f * seg) + 0.25 * np.sin(2 * np.pi * 3 * f * seg + 0.3)) * np.exp(-seg * 14)
    lv = arp_lvl[min(int(t0 * SR), N - 1)]
    if lv > 0.01:
        place(arp, s * lv * 0.08, t0, pan=-0.35 if k % 2 else 0.35)
    k += 1
dl = int(3 * n16 * SR)
arp_d = arp.copy()
arp_d[dl:, 0] += arp[:-dl, 1] * 0.45
arp_d[2 * dl:, 1] += arp[:-2 * dl, 0] * 0.3
music += arp_d

k = 0
while k * beat < TOTAL:
    t0 = k * beat
    lv = kick_lvl[min(int(t0 * SR), N - 1)]
    if lv > 0.01:
        seg = tt(0.45)
        f = 45 + 110 * np.exp(-seg * 30)
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-seg * 7)
        place(music, np.tanh(kick * 2) * lv * 0.4, t0)
        hh = hp(rng.standard_normal(int(0.06 * SR)), 7000) * np.exp(-np.arange(int(0.06 * SR)) / SR * 60)
        place(music, hh * lv * 0.12, t0 + beat / 2, pan=0.2)
    k += 1

music = reverb(music, 2.8, 0.22, seed=3)[:N]
fade = np.minimum(1, t_all / 0.5) * np.minimum(1, (TOTAL - t_all) / 1.5)
# harter Musik-Stopp beim "STOPP!" (Hall wird abgeschnitten)
cut = np.where((t_all > fz) & (t_all < fs_), 0.2, 1.0)
cut = np.convolve(cut, np.ones(480) / 480, mode="same")
music *= (fade * cut)[:, None]

# --- Sprache ------------------------------------------------------------------
voice = np.zeros((N, 2))
for lid, l in lines.items():
    sr, v = wavfile.read(ROOT / "public" / "voice" / f"{lid}.wav")
    v = v.astype(np.float64) / 32768.0
    if v.ndim > 1:
        v = v.mean(axis=1)
    place(voice, v, l["start"], 1.0)
voice_room = reverb(voice, 0.6, 0.08, seed=9)[:N]


def save(name, x):
    x = np.clip(x, -1, 1)
    wavfile.write(ROOT / "build" / name, SR, (x * 32767).astype(np.int16))


save("music.wav", music / max(1e-9, np.abs(music).max()) * 0.9)
save("sfx.wav", sfx / max(1e-9, np.abs(sfx).max()) * 0.95)
save("voice.wav", voice_room / max(1e-9, np.abs(voice_room).max()) * 0.95)
print("ok", TOTAL)
