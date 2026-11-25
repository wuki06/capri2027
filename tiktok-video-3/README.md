# Sprung durch die Erde – 3D-TikTok-Video

3D-Erde (NASA-Texturen aus dem three.js-Projekt, Normal-/Glanzkarte, Wolken, Stadtlichter, Atmosphären-Shader),
aufgeschnitten bis zum Kern; eine Kapsel fällt durch einen Tunnel von Deutschland zum Antipoden bei Neuseeland.

**Fertiges Video:** `final/erdtunnel-tiktok.mp4` (1080×1920, 30 fps, ~85 s)
**Titel, Beschreibung, Hashtags:** `TIKTOK.md`

Physik (`scripts/fall.ts`): Schwerkraft im Erdinneren nach PREM, RK4 mit Δt = 0,05 s →
38,2 min bis zur anderen Seite (homogene Erde: 42,2 min), vmax = 35.581 km/h am Mittelpunkt.

Rendering: Remotion + @remotion/three (React Three Fiber), Software-WebGL (SwiftShader).
Neu bauen: `bash scripts/render.sh`.
