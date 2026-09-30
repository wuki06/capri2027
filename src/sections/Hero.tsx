/* Szene 4 — Welcome to Capri: aus dem Papier wird Capri */
import { CapriScene } from '../art/CapriScene';
import { ScrollCue } from '../components/Chrome';
import { W, long, PLACE } from '../lib/format';
import { asset } from '../lib/assets';
import { setVars, useScrollScene } from '../lib/scroll';
import { range } from '../lib/motion';

export function Hero({ arrived }: { arrived: boolean }) {
  const ref = useScrollScene<HTMLElement>((s) => {
    // Hero verlässt den Viewport: Ebenen mit unterschiedlicher Geschwindigkeit
    const out = range(s.view, 0.5, 1); // 0 wenn oben, 1 wenn weg
    setVars(ref.current, {
      '--far': out * 60,
      '--mid': out * 110,
      '--near': out * 170,
      '--fg': out * 240,
      '--leaf': out * -120,
      '--copy': out * -90,
      '--copyfade': 1 - range(out, 0, 0.7),
    });
  });

  const photo = asset(W.images.hero);
  return (
    <header ref={ref} className={`hero${arrived ? ' is-arrived' : ''}${photo ? ' with-photo' : ''}`} id="top">
      <CapriScene variant="hero" photo={photo} photoAlt="Capri, the Faraglioni and the Mediterranean sea" />
      <div className="hero-veil" aria-hidden="true"><span className="hero-sunbloom" /></div>

      <div className="hero-copy">
        <p className="kicker hero-l1">{W.text.hero.top}</p>
        <h1 className="names hero-names">
          <span className="hero-n1">{W.couple.first}</span>
          <span className="amp hero-amp">&amp;</span>
          <span className="hero-n2">{W.couple.second}</span>
        </h1>
        <p className="kicker hero-l3">
          {W.text.hero.invite[0]}<br />{W.text.hero.invite[1]}
        </p>
        <p className="hero-date hero-l4">{long(W.date)}</p>
        <p className="kicker kicker--small hero-l5">{PLACE}</p>
      </div>

      <ScrollCue label={W.text.hero.cue} active={arrived} />
    </header>
  );
}
