/* Sprach-Umschalter DE · TR — dezent oben links */
import { tick } from '../lib/haptics';
import { LANGS, useLang } from '../lib/i18n';

const LABEL = { de: { short: 'DE', long: 'Deutsch' }, tr: { short: 'TR', long: 'Türkçe' } } as const;

export function LangSwitch({ visible }: { visible: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`lang-switch${visible ? ' is-visible' : ''}`} role="group" aria-label="Sprache · Dil">
      {LANGS.map((l, i) => (
        <span key={l} className="lang-item">
          {i > 0 && <i aria-hidden="true">·</i>}
          <button
            type="button"
            className={`lang-btn press${lang === l ? ' is-on' : ''}`}
            lang={l}
            aria-pressed={lang === l}
            aria-label={LABEL[l].long}
            tabIndex={visible ? 0 : -1}
            onClick={() => { if (lang !== l) { tick(6); setLang(l); } }}
          >
            {LABEL[l].short}
          </button>
        </span>
      ))}
    </div>
  );
}
