import type { ReactNode } from 'react';
import type { TimelineIcon } from '../data/wedding';

const P: Record<TimelineIcon, ReactNode> = {
  glass: (
    <>
      <path d="M8 3 h8 l-1 8 a3 3 0 0 1 -6 0 z" />
      <path d="M12 14 v6 M8.5 20.5 h7" />
      <circle cx="11" cy="8" r=".6" /><circle cx="13" cy="6" r=".5" />
    </>
  ),
  rings: (
    <>
      <circle cx="9.5" cy="14" r="5" />
      <circle cx="14.5" cy="14" r="5" />
      <path d="M9 6.5 l1.5 -2 l1.5 2 z" />
    </>
  ),
  lemon: (
    <>
      <path d="M5 13 c0 -4 3 -6.5 7 -6.5 s7 2.5 7 6.5 s-3 6 -7 6 s-7 -2 -7 -6 z" />
      <path d="M12 6.5 c1 -2 3 -3 5.5 -3 c-1 2 -3 3 -5.5 3 z" />
    </>
  ),
  candle: (
    <>
      <path d="M9.5 11 h5 v10 h-5 z" />
      <path d="M12 11 v-1.5" />
      <path d="M12 3 c1.6 2 1.8 3.6 0 5 c-1.8 -1.4 -1.6 -3 0 -5 z" />
    </>
  ),
  heart: <path d="M12 19 c-6 -4 -8 -7 -8 -10 a4 4 0 0 1 8 -1 a4 4 0 0 1 8 1 c0 3 -2 6 -8 10 z" />,
  music: (
    <>
      <path d="M9 17 V6 l10 -2 v11" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="15" r="2" />
    </>
  ),
  moon: <path d="M15 4 a8 8 0 1 0 5 13 a6.5 6.5 0 0 1 -5 -13 z" />,
};

export function TimeIcon({ name, className }: { name: TimelineIcon; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
