# Das Domino-Rätsel – 3D-TikTok-Video

29 Dominosteine, jeder 1,5-mal größer (Whitehead 1983): von 5 mm bis 426 m. Bonus: Stein 63 würde bis zum Mond reichen.

**Fertiges Video:** `final/domino-tiktok.mp4` (1080×1920, 30 fps, ~78 s)

Physik (`scripts/domino.ts`): starre Quader, Kippen um die Vorderkante (RK4), Kontakt bei h·sinθ = Abstand,
Impulsübertrag auf den nächsten Stein, Anlehnen per Kontaktbedingung. Ganze Kette in Echtzeit: 47,7 s, 729 m lang.
Rendering: Remotion + @remotion/three, Software-WebGL. Neu bauen: `bash scripts/render.sh`.
