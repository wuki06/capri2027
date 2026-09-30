/* Findet hochgeladene Dateien automatisch (Liste wird beim Build aus public/assets erzeugt).
   In wedding.ts steht nur der Name OHNE Endung — .jpg, .png, .webp, .mp3 … werden erkannt. */

const FILES: string[] = typeof __PUBLIC_ASSETS__ !== 'undefined' ? __PUBLIC_ASSETS__ : [];
const LOWER = new Map(FILES.map((f) => [f.toLowerCase(), f]));
const EXT = ['.webp', '.jpg', '.jpeg', '.png', '.avif', '.mp3', '.m4a', '.aac', '.ogg', '.wav'];

export function asset(p: string | undefined | null): string {
  if (!p) return '';
  if (/^(https?:\/\/|data:)/i.test(p)) return p; // externe URL / Data-URL direkt verwenden
  const base = p.toLowerCase();
  if (LOWER.has(base)) return LOWER.get(base)!;
  for (const e of EXT) {
    const hit = LOWER.get(base + e);
    if (hit) return hit;
  }
  return '';
}
