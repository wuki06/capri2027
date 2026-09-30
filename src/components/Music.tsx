/* Musik: einmalige Einladung „Experience with music“ + dezenter, dauerhafter Regler */
import { useEffect, useState } from 'react';
import { music } from '../lib/audio';
import { tick } from '../lib/haptics';
import { W } from '../lib/format';
import { useLang } from '../lib/i18n';

export function useMusic() {
  const [playing, setPlaying] = useState(music.playing);
  useEffect(() => music.subscribe(setPlaying), []);
  return playing;
}

function Wave({ playing }: { playing: boolean }) {
  return (
    <span className={`wave${playing ? ' is-playing' : ''}`} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}

export function MusicControl({ visible }: { visible: boolean }) {
  const playing = useMusic();
  const { t } = useLang();
  if (!music.available) return null;
  return (
    <button
      type="button"
      className={`music-control press${visible ? ' is-visible' : ''}`}
      onClick={() => { tick(); void music.toggle(); }}
      aria-pressed={playing}
      aria-label={playing ? t(W.text.musicPrompt.pause) : t(W.text.musicPrompt.play)}
      tabIndex={visible ? 0 : -1}
    >
      <Wave playing={playing} />
    </button>
  );
}

export function MusicPrompt({ show, onDone }: { show: boolean; onDone: () => void }) {
  const playing = useMusic();
  const { t } = useLang();
  useEffect(() => { if (playing && show) onDone(); }, [playing, show, onDone]);
  if (!music.available) return null;
  return (
    <div className={`music-prompt${show ? ' is-visible' : ''}`} aria-hidden={!show}>
      <p className="music-prompt-line">{t(W.text.musicPrompt.line)}</p>
      <button
        type="button"
        className="music-prompt-btn press"
        tabIndex={show ? 0 : -1}
        onClick={() => { tick(); void music.play(); onDone(); }}
      >
        <Wave playing={false} />
        <span>{t(W.text.musicPrompt.button)}</span>
      </button>
      <button type="button" className="music-prompt-skip press" tabIndex={show ? 0 : -1} onClick={onDone}>
        {t(W.text.musicPrompt.skip)}
      </button>
    </div>
  );
}
