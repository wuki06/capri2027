/* RSVP — echte Validierung, austauschbarer Speicher-Service, ehrliche Statusmeldungen */
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { WaxSeal } from '../art/Seal';
import { SprigDivider } from '../art/Botanicals';
import { W, long } from '../lib/format';
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
    const errs = validate(d);
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
    const res = await submitRsvp(d);
    setPhase(res.status === 'saved' ? 'saved' : res.status === 'not-configured' ? 'not-configured' : 'error');
    requestAnimationFrame(() => formRef.current?.closest('section')?.querySelector<HTMLElement>('.rsvp-status')?.focus());
  }

  const text = summary(d);
  const wa = r.whatsappNumber ? `https://wa.me/${r.whatsappNumber}?text=${encodeURIComponent(text)}` : '';
  const mail = r.email ? `mailto:${r.email}?subject=${encodeURIComponent(`RSVP — ${d.firstName} ${d.lastName}`)}&body=${encodeURIComponent(text)}` : '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); tick(); } catch { setCopied(false); }
  };

  const t = W.text.rsvp;
  const inv = (k: keyof Errors) => ({ 'aria-invalid': Boolean(errors[k]) || undefined, 'aria-describedby': errors[k] ? `${id(String(k))}-err` : undefined });

  return (
    <section className="paper-scene rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <div className="deckle" aria-hidden="true" />
      <div className="rsvp-card">
        <h2 id="rsvp-title" className="rsvp-title" data-reveal>{t.title}</h2>
        <p className="rsvp-by" data-reveal>{t.replyBy}<br /><span>{long(r.deadline)}</span></p>
        <SprigDivider className="sprig" />

        {phase === 'saved' ? (
          <div className="rsvp-status rsvp-thanks" tabIndex={-1} role="status">
            <WaxSeal className="thanks-seal" />
            <p className="thanks-big">{(yes ? t.thanksYes : t.thanksNo)[0]}</p>
            <p>{(yes ? t.thanksYes : t.thanksNo)[1]}</p>
          </div>
        ) : (
          <form ref={formRef} className={`rsvp-form${phase === 'sending' ? ' is-sending' : ''}`} onSubmit={onSubmit} noValidate>
            <div className="field-pair">
              <Field id={id('firstName')} label="First name" error={errors.firstName}>
                <input id={id('firstName')} className="input" autoComplete="given-name" value={d.firstName} onChange={(e) => set('firstName', e.target.value)} {...inv('firstName')} />
              </Field>
              <Field id={id('lastName')} label="Last name" error={errors.lastName}>
                <input id={id('lastName')} className="input" autoComplete="family-name" value={d.lastName} onChange={(e) => set('lastName', e.target.value)} {...inv('lastName')} />
              </Field>
            </div>

            <Choice name="attending" legend="Will you attend?" value={d.attending} error={errors.attending}
              options={[{ value: 'yes', label: 'Joyfully accepts' }, { value: 'no', label: 'Regretfully declines' }]}
              onChange={(v) => set('attending', v)} />

            <div className={`rsvp-more${yes ? ' is-open' : ''}`} aria-hidden={!yes}>
              <div className="rsvp-more-inner">
                {yes && (
                  <>
                    <div className={`field${errors.guests ? ' has-error' : ''}`}>
                      <span className="field-label" id={id('guests-l')}>Number of guests</span>
                      <div className="stepper" role="group" aria-labelledby={id('guests-l')}>
                        <button type="button" className="step press" onClick={() => setGuests(d.guests - 1)} disabled={d.guests <= 1} aria-label="One guest less">−</button>
                        <output className="step-val" aria-live="polite">{d.guests}</output>
                        <button type="button" className="step press" onClick={() => setGuests(d.guests + 1)} disabled={d.guests >= r.maxGuests} aria-label="One guest more">+</button>
                      </div>
                      {errors.guests && <p className="field-error" role="alert">{errors.guests}</p>}
                    </div>

                    {d.guests > 1 && (
                      <div className="guest-names">
                        <p className="field-label">Guest names</p>
                        {Array.from({ length: d.guests - 1 }, (_, i) => {
                          const k = `guest-${i}` as const;
                          return (
                            <Field key={i} id={id(k)} label={`Guest ${i + 2} — full name`} error={errors[k]}>
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

                    <Choice name="meal" legend="Meal preference" value={d.meal} error={errors.meal}
                      options={r.meals.map((m) => ({ value: m, label: m }))} onChange={(v) => set('meal', v)} />

                    <Field id={id('dietary')} label="Allergies / dietary requirements" hint="(optional)" error={errors.dietary}>
                      <textarea id={id('dietary')} className="input textarea" rows={2} value={d.dietary} onChange={(e) => set('dietary', e.target.value)} {...inv('dietary')} />
                    </Field>

                    {eventOn('welcome') && (
                      <Choice name="welcomeEvent" legend={`${W.weekend.events.find((e) => e.id === 'welcome')?.rsvpQuestion ?? 'Welcome event'} · ${long(W.weekend.events.find((e) => e.id === 'welcome')?.date ?? W.date)}`}
                        value={d.welcomeEvent} error={errors.welcomeEvent}
                        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} onChange={(v) => set('welcomeEvent', v)} />
                    )}
                    {eventOn('farewell') && (
                      <Choice name="farewellBrunch" legend={`${W.weekend.events.find((e) => e.id === 'farewell')?.rsvpQuestion ?? 'Farewell brunch'} · ${long(W.weekend.events.find((e) => e.id === 'farewell')?.date ?? W.date)}`}
                        value={d.farewellBrunch} error={errors.farewellBrunch}
                        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} onChange={(v) => set('farewellBrunch', v)} />
                    )}

                    <Field id={id('song')} label="Song request" hint="(optional)" error={errors.song}>
                      <input id={id('song')} className="input" value={d.song} onChange={(e) => set('song', e.target.value)} placeholder="A song that gets you dancing" {...inv('song')} />
                    </Field>
                  </>
                )}
              </div>
            </div>

            <Field id={id('message')} label={`Message for ${W.couple.first} & ${W.couple.second}`} hint="(optional)" error={errors.message}>
              <textarea id={id('message')} className="input textarea" rows={3} value={d.message} onChange={(e) => set('message', e.target.value)} {...inv('message')} />
            </Field>

            {phase === 'not-configured' && (
              <div className="rsvp-status rsvp-note" tabIndex={-1} role="alert">
                <p>{t.notConnected}</p>
                <div className="rsvp-fallback">
                  {wa && <a className="btn-line press" href={wa} target="_blank" rel="noopener noreferrer">Send via WhatsApp</a>}
                  {mail && <a className="btn-line press" href={mail}>Send by email</a>}
                  <button type="button" className="btn-line press" onClick={copy}>{copied ? 'Copied' : 'Copy my reply'}</button>
                </div>
              </div>
            )}
            {phase === 'error' && (
              <p className="rsvp-status rsvp-note rsvp-note--error" tabIndex={-1} role="alert">{t.error}</p>
            )}

            <button type="submit" className="btn-seal press" disabled={phase === 'sending'} aria-busy={phase === 'sending'}>
              <span className="btn-seal-text">{phase === 'sending' ? 'Sending…' : t.submit}</span>
              <span className="btn-seal-ink" aria-hidden="true" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
