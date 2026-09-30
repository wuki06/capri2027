/* Emotionaler Übergang vor dem RSVP — Ruhe, viel Weißraum */
import { W } from '../lib/format';
import { useLang } from '../lib/i18n';
import { range } from '../lib/motion';
import { setVars, useScrollScene } from '../lib/scroll';

export function MissingYou() {
  const { t } = useLang();
  const m = t(W.text.missing);
  const ref = useScrollScene<HTMLElement>((s) => {
    setVars(ref.current, { '--m1': range(s.view, 0.22, 0.4), '--m2': range(s.view, 0.34, 0.52), '--mline': range(s.view, 0.3, 0.6) });
  });
  return (
    <section ref={ref} className="missing" aria-label={m.join(' ')}>
      <p className="missing-text" aria-hidden="true">
        <span style={{ opacity: 'var(--m1)', transform: 'translate3d(0, calc((1 - var(--m1)) * 14px), 0)' }}>{m[0]}</span>
        <span className="missing-you" style={{ opacity: 'var(--m2)', transform: 'translate3d(0, calc((1 - var(--m2)) * 14px), 0)' }}>{m[1]}</span>
      </p>
      <span className="missing-line" aria-hidden="true" />
    </section>
  );
}
