# Das Kugel-Rennen – TikTok-Physikrätsel

4 Kugeln, 4 reibungsfreie Bahnen (Gerade, Kreisbogen, Zykloide, Steilabsturz), gleiche Höhe, gleiches Ziel.
Freeze-Frame kurz vor dem Ziel → Rätselpause → Auflösung in Super-Zeitlupe → Bonus: Tautochrone.

**Fertiges Video:** `final/kugel-rennen-tiktok.mp4` (1080×1920, 30 fps, ~88 s)
**Titel, Beschreibung, Hashtags:** `TIKTOK.md`

Physik: `src/race.ts` – Bewegung entlang der Bogenlänge, s'' = g·dy/ds, RK4 mit Δt = 10 µs.
Ergebnisse (stimmen mit der analytischen Lösung überein): C 0,7093 s · B 0,7177 s · D 0,7946 s · A 0,8408 s.

Neu bauen: `bash scripts/render.sh` (Voraussetzungen siehe `../tiktok-video/README.md`).
