/* The Wedding Day — goldene Linie füllt sich beim Scrollen, aktiver Punkt leuchtet */
import { useEffect, useRef } from 'react';
import { TimeIcon } from '../art/Icons';
import { W } from '../lib/format';
import { useLang } from '../lib/i18n';
import { clamp } from '../lib/motion';
import { useScrollScene } from '../lib/scroll';

export function WeddingDay() {
  const { t } = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const offsets = useRef<number[]>([]);

  useEffect(() => {
    const measure = () => {
      const items = list.current?.querySelectorAll<HTMLElement>('.tl-item');
      offsets.current = items ? Array.from(items, (el) => el.offsetTop + 22) : [];
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    return () => ro.disconnect();
  }, []);

  const ref = useScrollScene<HTMLElement>((s) => {
    const l = list.current, w = wrap.current;
    if (!l || !w) return;
    // Lesepunkt bei 62 % der Bildschirmhöhe
    const reach = s.vh * 0.62 - (s.top + w.offsetTop);
    const p = clamp(reach / Math.max(1, w.offsetHeight));
    if (line.current) line.current.style.transform = `scaleY(${p.toFixed(4)})`;
    const items = l.children;
    let active = -1;
    offsets.current.forEach((o, i) => { if (reach >= o) active = i; });
    for (let i = 0; i < items.length; i++) {
      const it = items[i] as HTMLElement;
      it.classList.toggle('is-past', i <= active);
      it.classList.toggle('is-active', i === active);
    }
  });

  return (
    <section ref={ref} className="paper-scene day" aria-labelledby="day-title">
      <div className="deckle" aria-hidden="true" />
      <h2 id="day-title" className="section-title" data-reveal>{t(W.text.weddingDay.title)}</h2>
      <div ref={wrap} className="tl-wrap">
      <span className="tl-track" aria-hidden="true"><span ref={line} className="tl-fill" /></span>
      <ol ref={list} className="tl">
        {W.timeline.map((it) => (
          <li key={it.id} className="tl-item">
            <span className="tl-dot" aria-hidden="true" />
            <time className="tl-time">{it.time}</time>
            <div className="tl-body">
              <h3 className="tl-title"><TimeIcon name={it.icon} className="tl-icon" />{t(it.title)}</h3>
              {t(it.text) && <p className="tl-text">{t(it.text)}</p>}
            </div>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
