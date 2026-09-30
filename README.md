# Melek & Alessio — Capri 2027 · Digitale Hochzeitseinladung

React + TypeScript + Vite · keine weiteren Bibliotheken · mobile-first

## 1 · Online stellen (einmalig)
1. github.com → **New repository** → Name z. B. `capri-2027` → Create.
2. Im neuen Repo: **uploading an existing file** → den **Inhalt** dieses Ordners hineinziehen
   (alle Dateien und Ordner, nicht den Ordner selbst) → **Commit changes**.
3. vercel.com → **Add New → Project** → das Repo auswählen → Framework **Vite** → **Deploy**.
4. Die Vercel-Adresse (z. B. `https://capri-2027.vercel.app`) in `src/data/wedding.ts` bei
   `site.url` eintragen → speichern (Commit) → WhatsApp-Vorschaubild funktioniert.

## 2 · Bilder hochladen
Ordner im Repo öffnen → **Add file → Upload files** → Datei hineinziehen → **Commit**.
Direktlink (BENUTZERNAME / REPO ersetzen):
`https://github.com/BENUTZERNAME/REPO/upload/main/public/assets/capri`

| Datei | Ordner |
|---|---|
| hero, benvenuti, sunset, night | `public/assets/capri/` |
| venue | `public/assets/venue/` |
| band, song.mp3 | `public/assets/music/` |
| look-1 … look-4 | `public/assets/couple/` |

Endung egal (.jpg .png .webp). Vercel baut nach jedem Commit automatisch neu (ca. 1 Minute).
Fehlt ein Bild, wird die gezeichnete Illustration gezeigt. Prompts: **BILDER-PROMPTS.md**.

## Sprachen (Deutsch · Türkisch)
- Gäste wechseln oben links mit **DE · TR**.
- Link für die türkische Familie: `https://DEINE-ADRESSE/?lang=tr` (öffnet direkt auf Türkisch).
- Link auf Deutsch: `https://DEINE-ADRESSE/?lang=de`.
- Texte stehen in `src/data/wedding.ts` jeweils als `de: '…'` und `tr: '…'`.

## 3 · Inhalte ändern
Alles in **`src/data/wedding.ts`**: Zeiten, Location (`venue.name` ausfüllen = echte Location
erscheint), Band-Links, Farben, Weekend-Events (`enabled: false` blendet aus), Anreise-Texte,
RSVP-Einstellungen, alle Texte. Im GitHub-Web: Datei öffnen → Stift-Symbol → ändern → Commit.

## 4 · RSVP-Antworten speichern (Supabase)
1. supabase.com → New project.
2. **SQL Editor** → Inhalt von `supabase/rsvp.sql` einfügen → **Run**.
3. **Project Settings → API** → `Project URL` und `anon public` Key kopieren.
4. In `wedding.ts`: `provider: 'supabase'`, `supabaseUrl`, `supabaseAnonKey` eintragen → Commit.
5. Antworten ansehen: Supabase → **Table Editor → rsvps**.

Ohne Supabase zeigt das Formular ehrlich an, dass nichts gespeichert wurde, und bietet
WhatsApp/E-Mail an (`whatsappNumber` / `email` in `wedding.ts` ausfüllen).

## 5 · Vor dem Versand an die Gäste
- [ ] `site.url` eingetragen
- [ ] `song.mp3` hochgeladen **oder** `music.showWithoutFile: false`
- [ ] RSVP verbunden **oder** `whatsappNumber` / `email` ausgefüllt
- [ ] Link einmal selbst in WhatsApp senden → Vorschaubild prüfen

## Lokal (optional)
`npm install` · `npm run dev` · `npm run build`
