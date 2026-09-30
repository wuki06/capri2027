/* The Capri Weekend — ein-/ausschaltbar in wedding.ts */
import { Fragment } from 'react';
import { SprigDivider } from '../art/Botanicals';
import { W, long, parts } from '../lib/format';
import { useLang } from '../lib/i18n';

export function Weekend() {
  const { t, lang } = useLang();
  if (!W.weekend.enabled) return null;
  const events = W.weekend.events.filter((e) => e.enabled);
  if (!events.length) return null;
  return (
    <section className="paper-scene weekend" aria-labelledby="weekend-title">
      <div className="deckle" aria-hidden="true" />
      <h2 id="weekend-title" className="section-title" data-reveal>{t(W.text.weekend.title)}</h2>
      <ol className="wk">
        {events.map((e, i) => {
          const p = parts(e.date, lang);
          const main = e.id === 'wedding';
          return (
            <Fragment key={e.id}>
              {i > 0 && <li aria-hidden="true" className="wk-sep"><SprigDivider className="sprig" /></li>}
              <li className={`wk-item${main ? ' wk-item--main' : ''}`} data-reveal>
                <time className="wk-date" dateTime={e.date}>
                  <span className="wk-day">{p.dd}</span>
                  <span className="wk-month">{p.month} {p.yyyy}</span>
                </time>
                <p className={main ? 'wk-kicker names' : 'wk-kicker'}>{t(e.kicker)}</p>
                <h3 className="wk-title">{t(e.title)}</h3>
                {t(e.text) && <p className="wk-text">{t(e.text)}</p>}
                <span className="sr-only">{long(e.date, lang)}</span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </section>
  );
}
