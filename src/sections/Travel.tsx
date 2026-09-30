/* Your Journey to Capri — Route zeichnet sich beim Scrollen; Inhalte in wedding.travel */
import { useRef } from 'react';
import { W } from '../lib/format';
import { range } from '../lib/motion';
import { useScrollScene } from '../lib/scroll';
import { tick } from '../lib/haptics';
import { useLang } from '../lib/i18n';

function GulfMap() {
  return (
    <svg className="gulf" viewBox="0 0 320 300" aria-hidden="true">
      {/* stilisierte Küste des Golfs von Neapel */}
      <path className="gulf-land" d="M6 40 C 40 52 70 44 96 60 C 120 74 150 70 176 64 C 204 58 226 76 240 100 C 250 118 256 136 262 150 C 246 160 220 172 204 198 C 198 210 190 220 190 226 C 214 220 250 214 280 206 C 296 202 308 200 316 198 L 316 0 L 6 0 Z" />
      <path className="gulf-coast" d="M6 40 C 40 52 70 44 96 60 C 120 74 150 70 176 64 C 204 58 226 76 240 100 C 250 118 256 136 262 150 C 246 160 220 172 204 198 C 198 210 190 220 190 226 C 214 220 250 214 280 206 C 296 202 308 200 316 198" />
      {/* Capri */}
      <path className="gulf-island" d="M120 250 C 128 240 146 236 160 240 C 172 244 180 250 176 258 C 170 266 150 268 136 264 C 126 262 116 258 120 250 Z" />
      <circle className="gulf-vesuvio" cx="228" cy="40" r="2" />
      {/* Route Neapel → Capri */}
      <path className="gulf-route-bg" d="M150 72 C 140 120 120 170 146 238" pathLength={1} />
      <path className="gulf-route" d="M150 72 C 140 120 120 170 146 238" pathLength={1} />
      <g className="gulf-pin gulf-pin--a"><circle cx="150" cy="72" r="4" /><circle cx="150" cy="72" r="9" className="gulf-halo" /></g>
      <g className="gulf-pin gulf-pin--b"><circle cx="146" cy="244" r="4" /><circle cx="146" cy="244" r="9" className="gulf-halo" /></g>
      <text x="162" y="82" className="gulf-label">Napoli</text>
      <text x="186" y="262" className="gulf-label gulf-label--b">Capri</text>
      <text x="214" y="30" className="gulf-label gulf-label--s">Vesuvio</text>
      <text x="226" y="200" className="gulf-label gulf-label--s">Sorrento</text>
    </svg>
  );
}

export function Travel() {
  const { t } = useLang();
  const map = useRef<HTMLDivElement>(null);
  const ref = useScrollScene<HTMLElement>((s) => {
    map.current?.style.setProperty('--route', range(s.view, 0.18, 0.48).toFixed(4));
  });
  return (
    <section ref={ref} className="paper-scene travel" aria-labelledby="travel-title">
      <div className="deckle" aria-hidden="true" />
      <h2 id="travel-title" className="section-title" data-reveal>{t(W.text.travel.title)}</h2>
      <div ref={map} className="gulf-wrap" data-reveal><GulfMap /></div>
      <ol className="journey">
        {W.travel.map((it, i) => (
          <li key={it.id} className="journey-item" data-reveal>
            <details onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) tick(5); }}>
              <summary className="press">
                <span className="journey-n" aria-hidden="true">{i + 1}</span>
                <span className="journey-title">{t(it.title)}</span>
                <span className="journey-plus" aria-hidden="true" />
              </summary>
              <div className="journey-body">
                {t(it.details).length ? t(it.details).map((d, j) => <p key={j}>{d}</p>) : <p className="journey-soon">{t(W.text.travel.soon)}</p>}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
