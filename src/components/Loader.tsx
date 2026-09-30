import { W, dots } from '../lib/format';

export function Loader({ leaving }: { leaving: boolean }) {
  const { left, right } = W.couple.monogram;
  return (
    <div className={`loader${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <div className="loader-inner">
        <svg className="loader-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="56" pathLength={1} />
        </svg>
        <p className="loader-mono" aria-hidden="true">
          <span>{left}</span>
          <span>{right}</span>
        </p>
        <p className="loader-place">{W.text.loader}</p>
        <p className="loader-date">{dots(W.date)}</p>
        <span className="loader-thread" aria-hidden="true"><i /></span>
        <span className="sr-only">Loading the invitation of {W.couple.first} and {W.couple.second}</span>
      </div>
    </div>
  );
}
