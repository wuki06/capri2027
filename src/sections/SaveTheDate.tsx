/* Save the Date — Papier-Szene mit Live-Countdown im Stil gedruckter Papeterie */
import { useEffect, useState } from 'react';
import { OliveBranch, SprigDivider } from '../art/Botanicals';
import { PLACE, W, countdownTarget, long, parts } from '../lib/format';
import { useLang } from '../lib/i18n';
import { cssVars } from '../lib/motion';

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      setNow(Date.now());
      t = setTimeout(loop, 1000 - (Date.now() % 1000) + 5); // exakt auf die Sekunde
    };
    loop();
    return () => clearTimeout(t);
  }, []);
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return { done: diff === 0, values: [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60] };
}

export function SaveTheDate() {
  const { done, values } = useCountdown(countdownTarget());
  const { t, lang } = useLang();
  const D = parts(W.date, lang);
  const units = t(W.text.saveTheDate.units);
  return (
    <section className="paper-scene save" aria-labelledby="save-title">
      <div className="deckle" aria-hidden="true" />
      <OliveBranch className="save-branch" seed={31} leaves={20} />
      <div className="save-inner">
        <h2 id="save-title" className="kicker" data-reveal>{t(W.text.saveTheDate.title)}</h2>
        <p className="save-date" aria-label={long(W.date, lang)}>
          <span className="save-day" data-reveal style={cssVars({ '--d': '.1s' })}>{D.dd}</span>
          <span className="save-month" data-reveal style={cssVars({ '--d': '.25s' })}>{D.month}</span>
          <span className="save-year" data-reveal style={cssVars({ '--d': '.4s' })}>{D.yyyy}</span>
        </p>
        <p className="kicker kicker--small" data-reveal style={cssVars({ '--d': '.5s' })}>{PLACE}</p>
        <SprigDivider className="sprig" />
        <p className="save-text" data-reveal>
          {t(W.text.saveTheDate.lines)[0]}<br />{t(W.text.saveTheDate.lines)[1]}
        </p>

        <div className="countdown" data-reveal role="timer" aria-live="off" aria-label={t(W.text.saveTheDate.aria)}>
          {done ? (
            <p className="countdown-done">{t(W.text.saveTheDate.after)}</p>
          ) : (
            values.map((v, i) => (
              <div className="cd-unit" key={i}>
                <span className="cd-num" key={v}>{i === 0 ? v : String(v).padStart(2, '0')}</span>
                <span className="cd-label">{units[i]}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
