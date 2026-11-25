# Chaos-Pendel – TikTok-Wissenschaftsvideo

1000 Doppelpendel, deren Startwinkel sich nur um ein Milliardstel Grad unterscheiden, werden nach ~8 s zu einem Regenbogen-Feuerwerk aus Chaos.

**Fertiges Video:** `final/chaos-pendel-tiktok.mp4` (1080×1920, 30 fps, ~72 s, H.264/AAC)
**Titel, Beschreibung, Hashtags:** `TIKTOK.md`

## Pipeline (100 % kostenlos & offline)
| Schritt | Werkzeug | Datei |
|---|---|---|
| Sprachausgabe (Deutsch) | Piper TTS, Stimme „Thorsten“ + FFmpeg-Veredelung | `scripts/tts.py` |
| Physik (Lagrange + RK4, 720 Schritte/s) | TypeScript | `src/physics.ts` |
| Timeline + Synchronisierung Physik ↔ Sprache | Node | `scripts/build.ts` |
| Musik & Soundeffekte (eigene Synthese) | numpy/scipy | `scripts/sound.py` |
| Animation, Untertitel, Neon-Bloom | Remotion 4 | `src/` |
| Mix, Ducking, Loudness −14 LUFS, Mux | FFmpeg | `scripts/render.sh` |

## Neu bauen
```bash
npm install && pip install piper-tts numpy scipy
# Stimme: https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-de-thorsten-low.tar.gz → voices/
bash scripts/render.sh
```
