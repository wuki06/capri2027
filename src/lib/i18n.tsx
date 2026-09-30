/* Zweisprachigkeit: Deutsch & Türkisch
   • Sprache per Umschalter (DE · TR), wird gespeichert
   • Link mit ?lang=tr öffnet direkt Türkisch (z. B. für die türkische Familie)
   • sonst: Handy-Sprache Türkisch → TR, alles andere → DE */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'de' | 'tr';
export type L<T = string> = { de: T; tr: T };
export const LANGS: Lang[] = ['de', 'tr'];

function initialLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'de' || q === 'tr') return q;
    const s = localStorage.getItem('lang');
    if (s === 'de' || s === 'tr') return s;
  } catch { /* ignore */ }
  const langs = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((l) => (l || '').toLowerCase());
  return langs.some((l) => l.startsWith('tr')) ? 'tr' : 'de';
}

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: <T>(v: L<T>) => T }
const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo<Ctx>(() => ({ lang, setLang, t: <T,>(v: L<T>) => v[lang] }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const c = useContext(LangCtx);
  if (!c) throw new Error('useLang outside LangProvider');
  return c;
}
