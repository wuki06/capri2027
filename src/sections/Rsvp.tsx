/* RSVP — echte Validierung, austauschbarer Speicher-Service, ehrliche Statusmeldungen */
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { WaxSeal } from '../art/Seal';
import { SprigDivider } from '../art/Botanicals';
import { W, long } from '../lib/format';
import { useLang } from '../lib/i18n';
import { tick } from '../lib/haptics';
import { emptyRsvp, eventOn, submitRsvp, summary, validate, type Errors, type RsvpData } from '../lib/rsvpService';

type Phase = 'form' | 'sending' | 'saved' | 'not-configured' | 'error';

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id} className="field-label">{label}{hint && <span className="field-hint"> {hint}</span>}</label>
      {children}
      {error && <p id={`${id}-err`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

function Choice<T extends string>({ name, legend, value, options, onChange, error }: {
  name: string; legend: string; value: T | ''; options: { value: T; label: string }[]; onChange: (v: T) => void; error?: string;
}) {
  return (
    <fieldset className={`choice${error ? ' has-error' : ''}`} id={`f-${name}`} aria-describedby={error ? `f-${name}-err` : undefined}>
      <legend className="field-label">{legend}</legend>
      <div className="choice-row">
        {options.map((o) => (
          <label key={o.value} className={`choice-opt press${value === o.value ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => { tick(5); onChange(o.value); }} />
            <span className="choice-ring" aria-hidden="true" />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {error && <p id={`f-${name}-err`} className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}

export function Rsvp() {
  const { t: tr, lang } = useLang();
  const T = W.text.rsvp;
  const [d, setD] = useState<RsvpData>(emptyRsvp);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>('form');
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const r = W.rsvp;
  const yes = d.attending === 'yes';

  const set = <K extends keyof RsvpData>(k: K, v: RsvpData[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const setGuests = (n: number) => {
    const v = Math.min(r.maxGuests, Math.max(1, n));
    tick(5);
    setD((p) => ({ ...p, guests: v, guestNames: Array.from({ length: v - 1 }, (_, i) => p.guestNames[i] ?? '') }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase === 'sending') return;
    const errs = validate(d, lang);
    setErrors(errs);
    const keys = Object.keys(errs).filter((k) => errs[k as keyof Errors]);
    if (keys.length) {
      tick(20);
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], .has-error input, .choice.has-error input');
        first?.focus({ preventScroll: true });
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }
    tick(10);
    setPhase('sending');
    const res = await submitRsvp(d, lang);
    setPhase(res.status === 'saved' ? 'saved' : res.status === 'not-configured' ? 'not-configured' : 'error');
    requestAnimationFrame(() => formRef.current?.closest('section')?.querySelector<HTMLElement>('.rsvp-status')?.focus());
  }

  const text = summary(d, lang);
  const wa = r.whatsappNumber ? `https://wa.me/${r.whatsappNumber}?text=${encodeURIComponent(text)}` : '';
  const mail = r.email ? `mailto:${r.email}?subject=${encodeURIComponent(`${lang === 'de' ? 'Antwort' : 'Yanıt'} — ${d.firstName} ${d.lastName}`)}&body=${encodeURIComponent(text)}` : '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); tick(); } catch { setCopied(false); }
  };

  const inv = (k: keyof Errors) => ({ 'aria-invalid': Boolean(errors[k]) || undefined, 'aria-describedby': errors[k] ? `${id(String(k))}-err` : undefined });

  return (
    <section className="paper-scene rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <div className="deckle" aria-hidden="true" />
      <div className="rsvp-card">
        <h2 id="rsvp-title" className="rsvp-title" data-reveal>{tr(T.title)}</h2>
        <p className="rsvp-by" data-reveal>{tr(T.replyBy)}<br /><span>{long(r.deadline, lang)}</span></p>
        <SprigDivider className="sprig" />

        {phase === 'saved' ? (
          <div className="rsvp-status rsvp-thanks" tabIndex={-1} role="status">
            <WaxSeal className="thanks-seal" />
            <p className="thanks-big">{tr(yes ? T.thanksYes : T.thanksNo)[0]}</p>
            <p>{tr(yes ? T.thanksYes : T.thanksNo)[1]}</p>
          </div>
        ) : (
          <form ref={formRef} className={`rsvp-form${phase === 'sending' ? ' is-sending' : ''}`} onSubmit={onSubmit} noValidate>
            <div className="field-pair">
              <Field id={id('firstName')} label={tr(T.firstName)} error={errors.firstName}>
                <input id={id('firstName')} className="input" autoComplete="given-name" value={d.firstName} onChange={(e) => set('firstName', e.target.value)} {...inv('firstName')} />
              </Field>
              <Field id={id('lastName')} label={tr(T.lastName)} error={errors.lastName}>
                <input id={id('lastName')} className="input" autoComplete="family-name" value={d.lastName} onChange={(e) => set('lastName', e.target.value)} {...inv('lastName')} />
              </Field>
            </div>

            <Choice name="attending" legend={tr(T.attend)} value={d.attending} error={errors.attending}
              options={[{ value: 'yes', label: tr(T.yes) }, { value: 'no', label: tr(T.no) }]}
              onChange={(v) => set('attending', v)} />

            <div className={`rsvp-more${yes ? ' is-open' : ''}`} aria-hidden={!yes}>
              <div className="rsvp-more-inner">
                {yes && (
                  <>
                    <div className={`field${errors.guests ? ' has-error' : ''}`}>
                      <span className="field-label" id={id('guests-l')}>{tr(T.guests)}</span>
                      <div className="stepper" role="group" aria-labelledby={id('guests-l')}>
                        <button type="button" className="step press" onClick={() => setGuests(d.guests - 1)} disabled={d.guests <= 1} aria-label={tr(T.less)}>−</button>
                        <output className="step-val" aria-live="polite">{d.guests}</output>
                        <button type="button" className="step press" onClick={() => setGuests(d.guests + 1)} disabled={d.guests >= r.maxGuests} aria-label={tr(T.more)}>+</button>
                      </div>
                      {errors.guests && <p className="field-error" role="alert">{errors.guests}</p>}
                    </div>

                    {d.guests > 1 && (
                      <div className="guest-names">
                        <p className="field-label">{tr(T.guestNames)}</p>
                        {Array.from({ length: d.guests - 1 }, (_, i) => {
                          const k = `guest-${i}` as const;
                          return (
                            <Field key={i} id={id(k)} label={tr(T.guestN).replace('{n}', String(i + 2))} error={errors[k]}>
                              <input id={id(k)} className="input" autoComplete="off" value={d.guestNames[i] ?? ''} {...inv(k)}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setD((p) => { const g = [...p.guestNames]; g[i] = v; return { ...p, guestNames: g }; });
                                  if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
                                }} />
                            </Field>
                          );
                        })}
                      </div>
                    )}

                    <Choice name="meal" legend={tr(T.meal)} value={d.meal} error={errors.meal}
                      options={r.meals.map((m) => ({ value: m.id, label: m[lang] }))} onChange={(v) => set('meal', v)} />

                    <Field id={id('dietary')} label={tr(T.dietary)} hint={tr(T.optional)} error={errors.dietary}>
                      <textarea id={id('dietary')} className="input textarea" rows={2} value={d.dietary} onChange={(e) => set('dietary', e.target.value)} {...inv('dietary')} />
                    </Field>

                    {(['welcome', 'farewell'] as const).map((ev) => {
                      const e = W.weekend.events.find((x) => x.id === ev);
                      if (!e || !eventOn(ev)) return null;
                      const key = ev === 'welcome' ? 'welcomeEvent' : 'farewellBrunch';
                      return (
                        <Choice key={ev} name={key} legend={`${tr(e.rsvpQuestion)} · ${long(e.date, lang)}`}
                          value={d[key]} error={errors[key]}
                          options={[{ value: 'yes', label: tr(T.yesShort) }, { value: 'no', label: tr(T.noShort) }]} onChange={(v) => set(key, v)} />
                      );
                    })}

                    <Field id={id('song')} label={tr(T.song)} hint={tr(T.optional)} error={errors.song}>
                      <input id={id('song')} className="input" value={d.song} onChange={(e) => set('song', e.target.value)} placeholder={tr(T.songPlaceholder)} {...inv('song')} />
                    </Field>
                  </>
                )}
              </div>
            </div>

            <Field id={id('message')} label={tr(T.message)} hint={tr(T.optional)} error={errors.message}>
              <textarea id={id('message')} className="input textarea" rows={3} value={d.message} onChange={(e) => set('message', e.target.value)} {...inv('message')} />
            </Field>

            {phase === 'not-configured' && (
              <div className="rsvp-status rsvp-note" tabIndex={-1} role="alert">
                <p>{tr(T.notConnected)}</p>
                <div className="rsvp-fallback">
                  {wa && <a className="btn-line press" href={wa} target="_blank" rel="noopener noreferrer">{tr(T.whatsapp)}</a>}
                  {mail && <a className="btn-line press" href={mail}>{tr(T.email)}</a>}
                  <button type="button" className="btn-line press" onClick={copy}>{copied ? tr(T.copied) : tr(T.copy)}</button>
                </div>
              </div>
            )}
            {phase === 'error' && (
              <p className="rsvp-status rsvp-note rsvp-note--error" tabIndex={-1} role="alert">{tr(T.error)}</p>
            )}

            <button type="submit" className="btn-seal press" disabled={phase === 'sending'} aria-busy={phase === 'sending'}>
              <span className="btn-seal-text">{phase === 'sending' ? tr(T.sending) : tr(T.submit)}</span>
              <span className="btn-seal-ink" aria-hidden="true" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
