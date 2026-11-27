# NOVYRA – Cinematic Brand Reveal (18 s, 9:16)

High-End-Werbevideo für NOVYRA (ERP-Systeme · Webseiten · Unternehmenssoftware · Digitale Lösungen).

**Fertiges Video:** `final/NOVYRA_CINEMATIC_REVEAL_4K_STYLE.mp4` – 1080 × 1920, 30 fps, 18,0 s, H.264 + AAC 320 kbit/s, −14 LUFS
**Thumbnail:** `final/NOVYRA_THUMBNAIL.jpg`

## Storyboard
| Zeit | Szene | Inhalt |
|---|---|---|
| 0–3 s | Hook | Partikelraum, elektrische Lichtlinien, „DIE ZUKUNFT IST DIGITAL.“, Kamera taucht durch die Schrift (Warp) |
| 3–7 s | ERP | 3D-Dashboard aus Glas-Panels: Umsatz, Kunden, Angebote/Rechnungen, Projekte, Mitarbeiter, Lager, Prozess – „ERP-SYSTEME. / Dein Unternehmen. Perfekt vernetzt.“ |
| 7–11 s | Web | Lichtübergang, Laptop/Tablet/Smartphone mit scrollenden Demo-Webseiten, Kamera-Orbit – „WEBSEITEN. / Design, das beeindruckt.“ |
| 11–14 s | Digital Solutions | 3D-Netzwerk mit Datenströmen & Modulen, Wörter exakt auf Musik-Impacts (11,3 / 12,3 / 13,3 s) |
| 14–18 s | Reveal | Lichtimpuls, Logo baut sich aus Partikeln (aus dem Originallogo abgetastet), Metall-Glanz, Claim, Leistungen, CTA |

## Technik
- Remotion 4 (React) · Canvas-Partikelsysteme · CSS-3D (Glassmorphism, Parallax, Geräte) · `@remotion/motion-blur` (CameraMotionBlur)
- Sounddesign: `scripts/sound.py` – 100 % eigene Synthese (numpy/scipy), lizenzfrei, auf Frames synchronisiert
- Mastering & Export: FFmpeg
- Logo: `public/novyra-logo.png` (aus der Vorlage freigestellt, Originalfarben)
- Alle Demo-Daten (Firmennamen, Beträge, Webseiten „Monolith“, „Aurelius“, „flowbase“) sind frei erfunden.

## Bearbeiten & neu rendern
```bash
npx remotion studio          # Live-Vorschau / Bearbeitung
bash scripts/render.sh       # komplettes Rendering inkl. Ton und Thumbnail
```
Szenen: `src/Hook.tsx`, `src/ERP.tsx`, `src/Web.tsx`, `src/Network.tsx`, `src/Reveal.tsx` · Timing-Konstanten jeweils `T0`/`T1` oben in der Datei.

Hinweis zur Logo-Qualität: Das Logo stammt aus einem Smartphone-Screenshot. Für maximale Schärfe einfach eine
Original-Logodatei (SVG oder PNG ≥ 2000 px) als `public/novyra-logo.png` ablegen und neu rendern.
