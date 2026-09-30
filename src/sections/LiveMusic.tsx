/* Live in Capri — beim Scrollen: Nachmittag → Golden Hour → Abend → Kerzen gehen an */
import { CapriScene } from '../art/CapriScene';
import { W } from '../lib/format';
import { asset } from '../lib/assets';
import { range, smooth } from '../lib/motion';
import { setVars, useScrollScene } from '../lib/scroll';

function Instruments() {
  // Gitarre · Darbuka · Mikrofon — feine Goldlinien (Ersatz bis zum Bandfoto)
  return (
    <svg className="instruments" viewBox="0 0 240 120" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
      <g transform="translate(20 8)">
        <path d="M30 4 v46" /><path d="M26 4 h8 v8 h-8 z" />
        <path d="M30 50 c-14 0 -20 8 -18 18 c1 6 -6 10 -6 20 c0 12 10 18 24 18 s24 -6 24 -18 c0 -10 -7 -14 -6 -20 c2 -10 -4 -18 -18 -18 z" />
        <circle cx="30" cy="74" r="6" /><path d="M24 96 h12" />
      </g>
      <g transform="translate(96 26)">
        <path d="M6 4 h36 c0 16 -10 22 -10 34 s8 18 8 32 h-32 c0 -14 8 -20 8 -32 s-10 -18 -10 -34 z" />
        <ellipse cx="24" cy="4" rx="18" ry="3.5" /><path d="M8 18 c10 3 22 3 32 0" opacity=".6" />
      </g>
      <g transform="translate(170 6)">
        <rect x="16" y="4" width="18" height="30" rx="9" /><path d="M20 12 h10 M20 18 h10 M20 24 h10" opacity=".6" />
        <path d="M12 26 c0 12 6 18 13 18 s13 -6 13 -18" /><path d="M25 44 v56 M13 100 h24" />
      </g>
    </svg>
  );
}

export function LiveMusic() {
  const ref = useScrollScene<HTMLElement>((s) => {
    const p = s.pin;
    const el = ref.current;
    const lit = p > 0.6;
    if (el && el.classList.contains('is-lit') !== lit) el.classList.toggle('is-lit', lit);
    setVars(el, {
      '--k-gold': smooth(range(p, 0.08, 0.36)) * (1 - range(p, 0.55, 0.8) * 0.6),
      '--k-dusk': smooth(range(p, 0.3, 0.56)),
      '--k-night': smooth(range(p, 0.5, 0.72)),
      '--shade': smooth(range(p, 0.34, 0.72)) * 0.62,
      '--stars': range(p, 0.6, 0.8),
      '--lights': range(p, 0.56, 0.7),
      '--sun': smooth(range(p, 0, 0.62)) * 230,
      '--far': -p * 30,
      '--mid': -p * 50,
      '--near': -p * 80,
      '--fg': -p * 40,
      '--leaf': (0.5 - p) * 120,
      '--k': range(p, 0.66, 0.74),
      '--name': range(p, 0.7, 0.8),
      '--l1': range(p, 0.76, 0.83),
      '--l2': range(p, 0.8, 0.87),
      '--l3': range(p, 0.84, 0.91),
      '--foot': range(p, 0.9, 0.97),
    });
  });
  const b = W.band;
  const bandPhoto = asset(b.photo);
  const [l1, l2, l3] = W.text.music.lines;
  return (
    <>
      <section ref={ref} className="pin pin--music" aria-labelledby="band-title">
        <div className="pin-stage">
          <CapriScene variant="music" festoon candles photo={asset(W.images.sunset)} photoNight={asset(W.images.night)} />
          <div className="music-copy">
            <p className="kicker kicker--light" style={{ opacity: 'var(--k)' }}>{W.text.music.kicker}</p>
            <h2 id="band-title" className="band-name">
              {b.name.split('').map((ch, i) => (
                <span key={i} style={{ opacity: `calc(var(--name) * ${b.name.length} - ${i})` }}>{ch}</span>
              ))}
            </h2>
            <p className="band-lines">
              <span style={{ opacity: 'var(--l1)' }}>{l1}</span>
              <span style={{ opacity: 'var(--l2)' }}>{l2}</span>
              <span style={{ opacity: 'var(--l3)' }}>{l3}</span>
            </p>
            <p className="kicker kicker--light kicker--small band-foot" style={{ opacity: 'var(--foot)' }}>
              {W.text.music.footer[0]}<br />{W.text.music.footer[1]}
            </p>
          </div>
        </div>
      </section>

      <section className="night-band" aria-label={`${b.name} — live band`}>
        <p className="band-langs" data-reveal>
          {b.languages.map((l, i) => (
            <span key={l}>{i > 0 && <i aria-hidden="true">·</i>}{l}</span>
          ))}
        </p>
        <figure className="band-portrait" data-reveal>
          {bandPhoto ? (
            <img src={bandPhoto} alt={`${b.name}, live band`} loading="lazy" decoding="async" />
          ) : (
            <Instruments />
          )}
        </figure>
        {(b.instagram || b.spotify) && (
          <p className="band-links" data-reveal>
            {b.instagram && <a className="btn-line btn-line--light press" href={b.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {b.spotify && <a className="btn-line btn-line--light press" href={b.spotify} target="_blank" rel="noopener noreferrer">Spotify</a>}
          </p>
        )}
      </section>
    </>
  );
}
