/* Dress Code — als italienisches Mode-Editorial: Stoffmuster wie ein Musterbuch aufgefächert */
import { W } from '../lib/format';
import { asset } from '../lib/assets';
import { cssVars } from '../lib/motion';
import { setVars, useScrollScene } from '../lib/scroll';

/** helle Schrift auf dunklen Stoffen */
function textOn(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55 ? 'rgba(250, 244, 232, .92)' : 'rgba(58, 47, 34, .8)';
}

export function DressCode() {
  const dc = W.dressCode;
  const n = dc.palette.length;
  const ref = useScrollScene<HTMLElement>((s) => {
    // Fächer öffnet sich, während die Sektion ins Bild kommt
    const f = Math.min(1, Math.max(0, (s.view - 0.12) / 0.38));
    setVars(ref.current, { '--fan': f * f * (3 - 2 * f) });
  });
  const words = dc.title.split(' ');
  const looks = dc.inspiration.map(asset).filter(Boolean);
  return (
    <section ref={ref} className="paper-scene dress" aria-labelledby="dress-title">
      <div className="deckle" aria-hidden="true" />
      <p className="kicker" data-reveal>{W.text.dressCode.kicker}</p>
      <h2 id="dress-title" className="dress-title">
        {words.map((w, i) => (
          <span key={i} className={`dress-word dress-word--${i}`} data-reveal style={cssVars({ '--d': `${i * 0.12}s` })}>{w}</span>
        ))}
      </h2>
      <div className="fan" role="list" aria-label="Colour inspiration">
        {dc.palette.map((c, i) => {
          const a = (i - (n - 1) / 2) * 11;
          return (
            <div key={c.name} role="listitem" className="swatch" style={cssVars({ '--a': `${a}deg`, '--c': c.hex, '--i': i, '--tc': textOn(c.hex) })}>
              <span className="swatch-name">{c.name}</span>
            </div>
          );
        })}
      </div>
      <p className="dress-lines" data-reveal>{dc.lines[0]}<br />{dc.lines[1]}</p>
      {looks.length > 0 && (
        <div className="dress-looks">
          {looks.map((src, i) => (
            <img key={src} src={src} alt={`Outfit inspiration ${i + 1}`} loading="lazy" decoding="async" data-reveal />
          ))}
        </div>
      )}
    </section>
  );
}
