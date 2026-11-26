#!/usr/bin/env bash
# Komplette Pipeline: Sprache -> Timeline/Physik -> Sound -> Video -> finales MP4
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build out final
python3 scripts/tts.py
node --experimental-strip-types scripts/build.ts
python3 scripts/sound.py
npx remotion render src/index.ts Domino out/video_raw.mp4 --codec=h264 --crf=16 --muted
ffmpeg -y -v error -i build/voice.wav -i build/music.wav -i build/sfx.wav -filter_complex \
  "[1:a]volume=-6dB[m];[0:a]asplit=2[v][vsc];[m][vsc]sidechaincompress=threshold=0.025:ratio=5:attack=25:release=400:makeup=1[md];[2:a]volume=-3dB[s];[v][md][s]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.95:level=false,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]" \
  -map "[out]" -c:a pcm_s16le build/mix.wav
ffmpeg -y -v error -i out/video_raw.mp4 -i build/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart \
  -metadata title="Eiskalt in 2 Minuten" final/kuehltrick-tiktok.mp4
echo "Fertig: final/kuehltrick-tiktok.mp4"
