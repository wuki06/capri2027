#!/usr/bin/env bash
# NOVYRA Cinematic Reveal – komplette Render-Pipeline
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build out final
python3 scripts/sound.py
ffmpeg -y -v error -i build/sound.wav -af "loudnorm=I=-14:TP=-1.0:LRA=9,aresample=48000" build/sound_master.wav
npx remotion render src/index.ts NovyraReveal out/video_raw.mov --codec=prores --prores-profile=hq --muted
ffmpeg -y -v error -i out/video_raw.mov -i build/sound_master.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 14 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 320k -ar 48000 -t 18 -movflags +faststart \
  -metadata title="NOVYRA – Engineering your digital future." final/NOVYRA_CINEMATIC_REVEAL_4K_STYLE.mp4
npx remotion still src/index.ts NovyraReveal build/thumb.png --frame=525
ffmpeg -y -v error -i build/thumb.png -q:v 2 final/NOVYRA_THUMBNAIL.jpg
echo "Fertig: final/NOVYRA_CINEMATIC_REVEAL_4K_STYLE.mp4"
