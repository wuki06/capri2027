/* Das Finale — Sonnenuntergang, Lichter gehen an, „One day. One island. One forever.“ */
import { CapriScene } from '../art/CapriScene';
import { Monogram } from '../art/Seal';
import { W, dots } from '../lib/format';
import { asset } from '../lib/assets';
import { tick } from '../lib/haptics';
import { range, smooth } from '../lib/motion';
import { setVars, useScrollScene } from '../lib/scroll';

export function Finale({ onReplay }: { onReplay: () => void }) {
  const ref = useScrollScene<HTMLElement>((s) => {
    const p = s.pin;
    const el = ref.current;
    const lit = p > 0.3;
    if (el && el.classList.contains('is-lit') !== lit) el.classList.toggle('is-lit', lit);
    const end = p > 0.8;
    if (el && el.classList.contains('is-end') !== end) el.classList.toggle('is-end', end);
    const w = (a: number, b: number, c: number, d: number) => range(p, a, b) * (1 - range(p, c, d));
    setVars(el, {
      '--k-gold': 1 - smooth(range(p, 0.1, 0.4)) * 0.8,
      '--k-dusk': smooth(range(p, 0.04, 0.3)),
      '--k-night': smooth(range(p, 0.26, 0.5)) * 0.85,
      '--shade': 0.25 + smooth(range(p, 0.08, 0.45)) * 0.4,
      '--stars': range(p, 0.35, 0.55),
      '--lights': range(p, 0.2, 0.36),
      '--sun': 170 + smooth(range(p, 0, 0.3)) * 90,
      '--far': -p * 20, '--mid': -p * 40, '--near': -p * 70, '--fg': -p * 30, '--leaf': (0.5 - p) * 100,
      '--f1': w(0.12, 0.18, 0.26, 0.3),
      '--f2': w(0.26, 0.32, 0.4, 0.44),
      '--f3': w(0.4, 0.46, 0.56, 0.6),
      '--end': range(p, 0.62, 0.72),
      '--end2': range(p, 0.7, 0.8),
      '--end3': range(p, 0.78, 0.88),
    });
  });
  const [a, b, c] = W.text.finale.lines;
  return (
    <section ref={ref} className="pin pin--finale" aria-labelledby="finale-title">
      <div className="pin-stage">
        <CapriScene variant="finale" candles photo={asset(W.images.sunset)} photoNight={asset(W.images.night)} />
        <div className="finale-words" aria-hidden="true">
          <p style={{ opacity: 'var(--f1)' }}>{a}</p>
          <p style={{ opacity: 'var(--f2)' }}>{b}</p>
          <p style={{ opacity: 'var(--f3)' }}>{c}</p>
        </div>
        <div className="finale-end">
          <p className="sr-only">{a} {b} {c}</p>
          <h2 id="finale-title" className="kicker kicker--light finale-see" style={{ opacity: 'var(--end)' }}>{W.text.finale.see}</h2>
          <p className="finale-date" style={{ opacity: 'var(--end)' }}>{dots(W.date)}</p>
          <p className="names finale-names" style={{ opacity: 'var(--end2)' }}>
            <span>{W.couple.first}</span><span className="amp">&amp;</span><span>{W.couple.second}</span>
          </p>
          <p className="finale-forever" style={{ opacity: 'var(--end2)' }}>{W.text.finale.forever}</p>
          <div className="finale-mono" style={{ opacity: 'var(--end3)' }}><Monogram /></div>
          <button type="button" className="btn-line btn-line--light press finale-replay" style={{ opacity: 'var(--end3)' }}
            onClick={() => { tick(10); onReplay(); }}>
            {W.text.finale.replay}
          </button>
        </div>
      </div>
    </section>
  );
}
