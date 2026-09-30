/* Benvenuti a Capri — gepinnte Szene mit räumlicher Tiefe */
import { CapriScene } from '../art/CapriScene';
import { W } from '../lib/format';
import { useLang } from '../lib/i18n';
import { asset } from '../lib/assets';
import { range, smooth } from '../lib/motion';
import { setVars, useScrollScene } from '../lib/scroll';

export function Benvenuti() {
  const ref = useScrollScene<HTMLElement>((s) => {
    const p = s.pin;
    const inn = range(s.view, 0, 0.35); // Einfahrt
    setVars(ref.current, {
      '--zoom': 1 + smooth(p) * 0.1,
      '--far': (1 - inn) * 40 - p * 20,
      '--mid': (1 - inn) * 80 - p * 50,
      '--near': (1 - inn) * 140 - p * 110,
      '--fg': (1 - inn) * 200 - p * 60,
      '--leaf': (1 - inn) * 160 - p * 220,
      '--sun': p * 60,
      '--k-gold': range(p, 0.2, 1) * 0.35,
      '--t1': range(p, 0.02, 0.2),
      '--t2': range(p, 0.12, 0.34),
      '--t3': range(p, 0.2, 0.42),
      '--t4': range(p, 0.28, 0.5),
      '--out': range(p, 0.86, 1),
    });
  });
  const { t } = useLang();
  const [l1, l2, l3] = t(W.text.benvenuti.lines);
  const photo = asset(W.images.benvenuti);
  return (
    <section ref={ref} className={`pin pin--benvenuti${photo ? ' with-photo' : ''}`} aria-labelledby="benvenuti-title">
      <div className="pin-stage">
        <CapriScene variant="bella" lemons photo={photo} photoAlt="View over the sea of Capri" />
        <div className="benvenuti-copy">
          <h2 id="benvenuti-title" className="benvenuti-title">
            {W.text.benvenuti.title.split(' ').map((w, i) => (
              <span key={i} className="mask"><span className="mask-in" style={{ transform: `translate3d(0, calc((1 - var(--t1)) * 110%), 0)` }}>{w}</span></span>
            ))}
          </h2>
          <p className="benvenuti-text">
            <span className="fade-line" style={{ opacity: 'var(--t2)' }}>{l1}</span>
            <span className="fade-line" style={{ opacity: 'var(--t3)' }}>{l2}</span>
            <span className="fade-line" style={{ opacity: 'var(--t4)' }}>{l3}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
