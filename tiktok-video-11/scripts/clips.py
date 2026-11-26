"""Schneidet die NASA-Aufnahmen (gemeinfrei) in 9:16-Clips für den Schnitt."""
import json, subprocess, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "build" / "timeline.json").read_text())
S = {s["id"]: s for s in TL["scenes"]}
# (Szene, Quelle, Startzeit in Sekunden, Gewicht) – Dauer wird auf die Szene verteilt
EDIT = [
    ("hook", "reel", 632, 1.0), ("hook", "earth1", 50, 1.0), ("hook", "zerog", 47, 1.1),
    ("orbit", "reel", 515, 1.0), ("orbit", "earth1", 15, 1.0),
    ("quiz", "tour", 180, 1.0), ("quiz", "tour", 225, 1.0), ("quiz", "tour", 720, 1.0), ("quiz", "tour", 465, 0.9),
    ("reveal", "earth1", 140, 0.8), ("reveal", "reel", 662, 1.1), ("reveal", "tour", 750, 1.1),
    ("explain", "earth1", 105, 1.0), ("explain", "reel", 600, 1.0), ("explain", "earth1", 30, 1.0),
    ("bonus", "earth1", 162, 1.0),
    ("outro", "tour", 900, 1.1), ("outro", "reel", 810, 0.9),
]
out_dir = ROOT / "public" / "clips"
out_dir.mkdir(parents=True, exist_ok=True)
plan = []
for sid in [s["id"] for s in TL["scenes"]]:
    items = [e for e in EDIT if e[0] == sid]
    if not items:
        continue
    start, end = S[sid]["start"], S[sid]["end"] + 0.6
    tot = sum(e[3] for e in items)
    t = start
    for (_, src, ss, w) in items:
        d = (end - start) * w / tot
        plan.append({"scene": sid, "src": src, "ss": ss, "start": round(t, 3), "dur": round(d, 3)})
        t += d
for i, p in enumerate(plan):
    p["file"] = f"clips/{i:02d}.mp4"
    vf = "crop=ih*9/16:ih,scale=1080:1920:flags=lanczos,fps=30,eq=contrast=1.06:saturation=1.12"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(p["ss"]), "-i", str(ROOT / "footage" / f"{p['src']}.mp4"),
                    "-t", str(p["dur"] + 0.5), "-vf", vf, "-an", "-c:v", "libx264", "-crf", "16", "-preset", "fast",
                    "-pix_fmt", "yuv420p", str(ROOT / "public" / p["file"])], check=True)
(ROOT / "src" / "clips.json").write_text(json.dumps(plan, indent=1))
print(len(plan), "Clips")
