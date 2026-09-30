/* ─────────────────────────────────────────────────────────────────────
   Ablauf:  Loading → Umschlag → (Siegel antippen) → Capri-Welt → Scroll-Geschichte
   ───────────────────────────────────────────────────────────────────── */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader } from './components/Loader';
import { Envelope } from './components/Envelope';
import { MusicControl, MusicPrompt } from './components/Music';
import { ProgressThread } from './components/Chrome';
import { Hero } from './sections/Hero';
import { SaveTheDate } from './sections/SaveTheDate';
import { Benvenuti } from './sections/Benvenuti';
import { Venue } from './sections/Venue';
import { LiveMusic } from './sections/LiveMusic';
import { WeddingDay } from './sections/WeddingDay';
import { DressCode } from './sections/DressCode';
import { Weekend } from './sections/Weekend';
import { Travel } from './sections/Travel';
import { MissingYou } from './sections/MissingYou';
import { Rsvp } from './sections/Rsvp';
import { Finale } from './sections/Finale';
import { engine } from './lib/scroll';
import { wait } from './lib/motion';

type Phase = 'loading' | 'envelope' | 'world';

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [loaderLeaving, setLoaderLeaving] = useState(false);
  const [envKey, setEnvKey] = useState(0);
  const [envMounted, setEnvMounted] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [controls, setControls] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const promptShown = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  // 1 · Loading: Schriften laden, dann sanft zum Umschlag
  useEffect(() => {
    let alive = true;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    Promise.all([Promise.race([fonts ? fonts.ready : Promise.resolve(), wait(2600)]), wait(1900)]).then(() => {
      if (!alive) return;
      setLoaderLeaving(true);
      later(() => alive && setPhase((p) => (p === 'loading' ? 'envelope' : p)), 1000);
    });
    return () => { alive = false; timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  // Scrollen erst in der Capri-Welt erlauben
  useEffect(() => {
    const locked = phase !== 'world';
    document.documentElement.classList.toggle('is-locked', locked);
    if (!locked) engine.refresh();
  }, [phase]);

  // Einblendungen beim Scrollen (einmal pro Durchlauf)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-in'); }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Musik-Einladung verschwindet, sobald weitergescrollt wird
  useEffect(() => engine.onGlobal((_p, _v, y) => {
    if (y > window.innerHeight * 0.5) setPrompt((s) => (s ? false : s));
  }), []);

  const onOpened = useCallback(() => {
    window.scrollTo(0, 0);
    setPhase('world');
    setArrived(true);
    setControls(true);
    later(() => setEnvMounted(false), 1100);
    if (!promptShown.current) {
      promptShown.current = true;
      later(() => { if (window.scrollY < window.innerHeight * 0.4) setPrompt(true); }, 3000);
    }
  }, []);

  const closePrompt = useCallback(() => setPrompt(false), []);
  useEffect(() => { document.documentElement.classList.toggle('has-prompt', prompt); }, [prompt]);

  const replay = useCallback(() => {
    setPrompt(false);
    setArrived(false);
    document.querySelectorAll('[data-reveal].is-in').forEach((el) => el.classList.remove('is-in'));
    document.documentElement.classList.add('is-locked');
    window.scrollTo(0, 0);
    setEnvKey((k) => k + 1);
    setEnvMounted(true);
    setPhase('envelope');
    engine.refresh();
  }, []);

  const inWorld = phase === 'world';
  return (
    <>
      <a className="skip-link" href="#rsvp">Skip to RSVP</a>

      <main className={`world${inWorld ? ' is-live' : ''}`} inert={!inWorld} aria-hidden={!inWorld}>
        <Hero arrived={arrived} />
        <SaveTheDate />
        <Benvenuti />
        <Venue />
        <LiveMusic />
        <WeddingDay />
        <DressCode />
        <Weekend />
        <Travel />
        <MissingYou />
        <Rsvp />
        <Finale onReplay={replay} />
      </main>

      <ProgressThread visible={inWorld} />
      <MusicControl visible={controls && inWorld} />
      <MusicPrompt show={prompt} onDone={closePrompt} />

      {envMounted && (
        <Envelope key={envKey} ready={loaderLeaving || phase !== 'loading'} onOpened={onOpened} />
      )}
      {phase === 'loading' && <Loader leaving={loaderLeaving} />}
    </>
  );
}
