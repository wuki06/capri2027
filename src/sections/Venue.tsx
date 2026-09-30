/* The Venue — austauschbar über wedding.venue (Name ausfüllen = echte Location) */
import { WhiteFlowers } from '../art/Botanicals';
import { W } from '../lib/format';
import { asset } from '../lib/assets';
import { setVars, useScrollScene } from '../lib/scroll';

function ArchIllustration() {
  // Blick durch einen Villenbogen auf Meer und Faraglioni (Ersatz bis zum echten Foto)
  return (
    <svg className="arch-art" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="archSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3EAE6" /><stop offset=".6" stopColor="#F5EBDA" /><stop offset="1" stopColor="#F1DEC2" />
        </linearGradient>
        <linearGradient id="archSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DB9C0" /><stop offset="1" stopColor="#4F7690" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#archSky)" />
      <circle cx="190" cy="170" r="60" fill="#FFF3DA" opacity=".6" />
      <rect y="228" width="300" height="172" fill="url(#archSea)" />
      <path d="M140 236 C 142 210 148 186 156 176 C 162 170 168 176 170 186 C 174 206 178 222 180 236 Z" fill="#CDB999" />
      <path d="M184 236 C 186 218 192 204 200 198 C 208 196 214 206 216 220 L 218 236 Z M196 236 C 197 226 200 222 204 222 C 207 224 208 230 208 236 Z" fill="#C4AF8D" fillRule="evenodd" />
      <path d="M222 236 C 224 226 230 218 236 218 C 240 220 242 228 244 236 Z" fill="#C4AF8D" />
      <g fill="#FFF6DE" opacity=".8">
        <rect x="180" y="250" width="18" height="1.6" rx=".8" /><rect x="170" y="262" width="30" height="1.6" rx=".8" />
        <rect x="186" y="276" width="22" height="1.6" rx=".8" /><rect x="160" y="292" width="40" height="1.8" rx=".9" />
      </g>
      <rect y="330" width="300" height="70" fill="#EDE3D1" />
      <rect y="326" width="300" height="8" fill="#E1D3B9" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={i * 26 + 4} y="336" width="10" height="60" rx="4" fill="#E6DAC4" />
      ))}
    </svg>
  );
}

export function Venue() {
  const v = W.venue;
  const t = W.text.venue;
  const real = Boolean(v.name.trim());
  const photo = asset(v.photo);
  const ref = useScrollScene<HTMLElement>((s) => {
    setVars(ref.current, { '--arch': (s.view - 0.5) * -40, '--archzoom': 1.12 - s.view * 0.12 });
  });
  return (
    <section ref={ref} className="paper-scene venue" aria-labelledby="venue-title">
      <div className="deckle" aria-hidden="true" />
      <p className="kicker" data-reveal>{t.kicker}</p>
      <figure className="arch" data-reveal>
        <div className="arch-frame">
          <div className="arch-inner">
            {photo ? <img src={photo} alt={real ? `${v.name}, ${W.place.city}` : 'A dream location in Capri'} loading="lazy" decoding="async" /> : <ArchIllustration />}
          </div>
        </div>
        <WhiteFlowers className="arch-flowers" seed={17} />
      </figure>
      {real ? (
        <>
          <h2 id="venue-title" className="venue-title" data-reveal>{v.name}</h2>
          {v.address && <address className="venue-address" data-reveal>{v.address}</address>}
          {v.description && <p className="venue-text" data-reveal>{v.description}</p>}
          {(v.mapsUrl || v.coordinates) && (
            <a
              className="btn-line press"
              data-reveal
              href={v.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${v.coordinates!.lat},${v.coordinates!.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.mapsButton}
            </a>
          )}
        </>
      ) : (
        <>
          <h2 id="venue-title" className="venue-title" data-reveal>{t.placeholderTitle[0]}<br />{t.placeholderTitle[1]}</h2>
          {t.placeholderText.map((p, i) => <p key={i} className="venue-text" data-reveal>{p}</p>)}
          <p className="venue-soon" data-reveal>{t.soon}</p>
        </>
      )}
    </section>
  );
}
