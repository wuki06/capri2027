"""Deutsche Sprachausgabe mit Piper TTS (offline, kostenlos) + FFmpeg-Nachbearbeitung."""
import json, subprocess, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / "narration.json").read_text())
out_dir = ROOT / "public" / "voice"; out_dir.mkdir(parents=True, exist_ok=True)
raw_dir = ROOT / "build" / "voice_raw"; raw_dir.mkdir(parents=True, exist_ok=True)
model = ROOT / "voices" / "de-thorsten-low.onnx"
v = cfg["voice"]
durations = {}
for line in cfg["lines"]:
    raw = raw_dir / f"{line['id']}.wav"
    subprocess.run([sys.executable, "-m", "piper", "-m", str(model), "-f", str(raw),
                    "--length-scale", str(v["lengthScale"]), "--noise-scale", str(v["noiseScale"]),
                    "--noise-w-scale", str(v["noiseW"]), "--sentence-silence", "0.18"],
                   input=line["say"].encode(), check=True, capture_output=True)
    out = out_dir / f"{line['id']}.wav"
    af = ",".join([
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02",
        "areverse", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05", "areverse",
        "aresample=48000:resampler=soxr",
        "highpass=f=70", "equalizer=f=180:t=q:w=1:g=2.5", "equalizer=f=3200:t=q:w=1.2:g=3",
        "aexciter=amount=1.2:drive=6:blend=0:freq=4500:ceil=16000",
        "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=3",
        "alimiter=limit=0.92",
    ])
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af", af, "-ac", "1", str(out)], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                       "-of", "csv=p=0", str(out)]).decode())
    durations[line["id"]] = d
    print(f"{line['id']}: {d:.2f}s  {line['say']}")
(ROOT / "build" / "durations.json").write_text(json.dumps(durations, indent=1))
print("total speech:", round(sum(durations.values()), 2))
