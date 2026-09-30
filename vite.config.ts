import { defineConfig, type Plugin } from 'vite';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { wedding } from './src/data/wedding';

/** Setzt Titel, Beschreibung und Vorschaubild aus src/data/wedding.ts in index.html ein
 *  (WhatsApp liest nur statisches HTML, kein JavaScript). */
function socialMeta(): Plugin {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const base = wedding.site.url.replace(/\/$/, '');
  const img = wedding.site.ogImage.startsWith('http') ? wedding.site.ogImage : `${base}${wedding.site.ogImage}`;
  const map: Record<string, string> = {
    '%OG_TITLE%': esc(wedding.site.title),
    '%OG_DESCRIPTION%': esc(wedding.site.description),
    '%OG_IMAGE%': esc(img),
    '%OG_URL%': esc(base || '/'),
    '%THEME_COLOR%': esc(wedding.site.themeColor),
  };
  return {
    name: 'social-meta',
    transformIndexHtml(html) {
      return Object.entries(map).reduce((h, [k, v]) => h.split(k).join(v), html);
    },
  };
}

/** Liste aller hochgeladenen Dateien in public/assets → Bilder/Musik werden automatisch erkannt */
function listAssets(dir = 'public/assets', base = '/assets'): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? listAssets(p, `${base}/${f}`) : [`${base}/${f}`];
  });
}

export default defineConfig({
  plugins: [react(), socialMeta()],
  define: { __PUBLIC_ASSETS__: JSON.stringify(listAssets()) },
  build: { target: 'es2020', cssTarget: ['safari15', 'chrome100'] },
});
