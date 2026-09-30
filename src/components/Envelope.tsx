/* ─────────────────────────────────────────────────────────────────────
   Der Briefumschlag
   1 Siegel reagiert · 2 Goldreflex · 3 Wachs bricht · 4 Klappe öffnet
   5 warmes Licht · 6 Karte gleitet heraus · 7 Kamera folgt der Karte
   8/9 Karte füllt den Bildschirm · 10 nahtloser Übergang (Papier → Capri)
   ───────────────────────────────────────────────────────────────────── */
import { useRef, useState, type KeyboardEvent } from 'react';
import { OliveBranch } from '../art/Botanicals';
import { Monogram, WaxSeal } from '../art/Seal';
import { paperSlide, sealCrack } from '../lib/audio';
import { tick } from '../lib/haptics';
import { W, dots, PLACE } from '../lib/format';
import { EASE, EASE_OUT, animate, reducedMotion, wait } from '../lib/motion';
import { useLang } from '../lib/i18n';

interface Props {
  ready: boolean;
  onOpened: () => void;
}

export function Envelope({ ready, onOpened }: Props) {
  const { t } = useLang();
  const busy = useRef(false);
  const [state, setState] = useState<'idle' | 'opening' | 'done'>('idle');
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const seal = useRef<HTMLDivElement>(null);
  const halfTop = useRef<HTMLDivElement>(null);
  const halfBottom = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const flapShadow = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const cardFace = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);

  async function open() {
    if (busy.current || !ready) return; // Doppeltippen: Sequenz nur einmal
    busy.current = true;
    setState('opening');
    tick(12);
    root.current?.classList.add('is-opening');

    if (reducedMotion()) {
      sealCrack();
      await animate(caption.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      await animate(stage.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 700 });
      await animate(table.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
      setState('done');
      onOpened();
      return;
    }

    // 1 · Siegel reagiert auf Berührung + 2 · Goldreflex
    seal.current?.classList.add('is-sheen');
    void animate(caption.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
    await animate(seal.current, [{ transform: 'scale(1)' }, { transform: 'scale(.95)' }], { duration: 220, easing: EASE_OUT });
    await wait(420);

    // 3 · Wachs bricht entlang einer Linie
    sealCrack();
    tick(6);
    if (seal.current) seal.current.style.visibility = 'hidden';
    halfTop.current?.classList.add('is-on');
    halfBottom.current?.classList.add('is-on');
    void animate(halfTop.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px) rotate(-1.5deg)' }], { duration: 260, easing: EASE_OUT });
    await animate(halfBottom.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px) rotate(2deg)' }], { duration: 260, easing: EASE_OUT });
    await wait(160);

    // 4 · Obere Klappe öffnet sich
    paperSlide(1.1);
    void animate(flapShadow.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
    const flapAnim = animate(flap.current, [
      { transform: 'rotateX(0deg)' },
      { transform: 'rotateX(180deg)' },
    ], { duration: 1400, easing: EASE });
    void animate(halfBottom.current, [
      { transform: 'translateY(4px) rotate(2deg)', opacity: 1 },
      { transform: 'translateY(26px) rotate(9deg)', opacity: 0 },
    ], { duration: 900, delay: 250, easing: EASE });
    await wait(700);
    top.current?.classList.add('is-behind'); // ab 90° hinter die Karte

    // 5 · Warmes Licht aus dem Inneren
    void animate(glow.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: EASE_OUT });
    await flapAnim;

    // 6 · Karte gleitet heraus
    paperSlide(1.3, 0.05);
    await animate(card.current, [
      { transform: 'translate3d(0,0,0)' },
      { transform: 'translate3d(0,-58%,0)' },
    ], { duration: 1600, easing: EASE });

    // 7–9 · Kamera folgt: Umschlag sinkt weg, Karte kommt nach vorn und füllt den Bildschirm
    const c = card.current;
    if (c) {
      const r = c.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const dx = vw / 2 - (r.left + r.width / 2);
      const dy = vh / 2 - (r.top + r.height / 2);
      const s = Math.max(vw / r.width, vh / r.height) * 1.08;
      const baseY = -0.58 * c.offsetHeight;
      for (const el of [body.current, front.current, top.current]) {
        void animate(el, [
          { transform: 'translate3d(0,0,0)', opacity: 1 },
          { transform: 'translate3d(0,55vh,0)', opacity: 0 },
        ], { duration: 1500, easing: 'cubic-bezier(0.5, 0, 0.75, 0.2)' });
      }
      void animate(table.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 1600, delay: 300 });
      void animate(cardFace.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 900 });
      await animate(c, [
        { transform: `translate3d(0, ${baseY}px, 0) scale(1)` },
        { transform: `translate3d(${dx}px, ${baseY + dy}px, 0) scale(${s})` },
      ], { duration: 1800, easing: EASE });
    }

    // 10 · Übergabe an die Welt (Papierfarbe = Schleier der Hero-Szene)
    setState('done');
    onOpened();
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void open(); }
  };

  return (
    <div ref={root} className={`envelope-screen${ready ? ' is-ready' : ''}${state === 'done' ? ' is-done' : ''}`}>
      <div ref={table} className="table" aria-hidden="true">
        <div className="table-shadow"><OliveBranch className="table-branch" seed={21} leaves={30} mono="#3b3222" /></div>
      </div>

      <div ref={stage} className={`env-stage${state !== 'idle' ? ' is-still' : ''}`}>
        <div className="envelope" onClick={() => void open()}>
          <div ref={body} className="env-body">
            <div className="env-back">
              <div className="env-liner" />
            </div>
            <div ref={glow} className="env-glow" />
          </div>

          {/* Karte (liegt zwischen Rückseite und Vordertasche) */}
          <div ref={card} className="env-card">
            <div ref={cardFace} className="env-card-face">
              <Monogram className="card-mono" />
              <p className="card-names">{W.couple.first} <span>&amp;</span> {W.couple.second}</p>
              <p className="card-date">{dots(W.date)}</p>
            </div>
          </div>

          <div ref={front} className="env-front-wrap">
            <div className="env-pocket">
              <svg className="env-folds" viewBox="0 0 100 136" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 136 L 50 76 L 100 136" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".5" transform="translate(0 .4)" />
                <path d="M0 136 L 50 76 L 100 136" fill="none" stroke="#9C8358" strokeOpacity=".28" strokeWidth=".45" />
                <path d="M0 0 L 50 76 L 100 0" fill="none" stroke="#9C8358" strokeOpacity=".16" strokeWidth=".35" />
              </svg>
              <OliveBranch className="emboss emboss--l" seed={5} leaves={14} olives={2} mono="currentColor" />
              <OliveBranch className="emboss emboss--r" seed={9} leaves={14} olives={2} mono="currentColor" />
              <div className="env-print">
                <p className="env-print-line">{t(W.text.envelope.line1)}</p>
                <p className="env-print-date">{dots(W.date)}</p>
                <p className="env-print-place">{PLACE}</p>
              </div>
            </div>
            <div ref={halfBottom} className="seal-half seal-half--bottom" aria-hidden="true"><WaxSeal /></div>
          </div>

          <div ref={top} className="env-top" aria-hidden="true">
            <div ref={flapShadow} className="env-flap-shadow" />
            <div ref={flap} className="env-flap">
              <div className="flap-face flap-front" />
              <div className="flap-face flap-back" />
              <div ref={halfTop} className="seal-half seal-half--top"><WaxSeal /></div>
            </div>
          </div>

          <div
            ref={seal}
            className="seal"
            role="button"
            tabIndex={state === 'idle' ? 0 : -1}
            aria-label={`${t(W.text.envelope.aria)} — ${W.couple.first} & ${W.couple.second}`}
            aria-disabled={state !== 'idle'}
            onKeyDown={onKey}
            onClick={(e) => { e.stopPropagation(); void open(); }}
          >
            <WaxSeal className="seal-svg" />
          </div>
        </div>
      </div>

      <div ref={caption} className="env-caption" aria-hidden={state !== 'idle'}>
        <span className="env-caption-line" aria-hidden="true" />
        <p>{t(W.text.envelope.cta)}</p>
      </div>
    </div>
  );
}
