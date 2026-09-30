/* ─────────────────────────────────────────────────────────────────────
   RSVP-Service — austauschbare Speicherung
   provider: 'none' | 'supabase' | 'webhook'   (in wedding.ts)
   Regel: Es wird NIEMALS „gespeichert“ angezeigt, wenn nichts gespeichert wurde.
   ───────────────────────────────────────────────────────────────────── */
import { wedding } from '../data/wedding';

export type Attendance = 'yes' | 'no';
export type YesNo = 'yes' | 'no' | '';

export interface RsvpData {
  firstName: string;
  lastName: string;
  attending: Attendance | '';
  guests: number;
  guestNames: string[];
  meal: string;
  dietary: string;
  welcomeEvent: YesNo;
  farewellBrunch: YesNo;
  song: string;
  message: string;
}

export type SubmitResult =
  | { status: 'saved' }
  | { status: 'not-configured' }
  | { status: 'error'; message: string };

export type Errors = Partial<Record<keyof RsvpData | `guest-${number}`, string>>;

export function emptyRsvp(): RsvpData {
  return {
    firstName: '', lastName: '', attending: '', guests: 1, guestNames: [], meal: '',
    dietary: '', welcomeEvent: '', farewellBrunch: '', song: '', message: '',
  };
}

export function eventOn(id: string) {
  return wedding.weekend.enabled && wedding.weekend.events.some((e) => e.id === id && e.enabled);
}

export function validate(d: RsvpData): Errors {
  const e: Errors = {};
  const name = /^[\p{L}\p{M}' .-]{1,60}$/u;
  if (!d.firstName.trim()) e.firstName = 'Please enter your first name.';
  else if (!name.test(d.firstName.trim())) e.firstName = 'Please use letters only.';
  if (!d.lastName.trim()) e.lastName = 'Please enter your last name.';
  else if (!name.test(d.lastName.trim())) e.lastName = 'Please use letters only.';
  if (!d.attending) e.attending = 'Please let us know if you can attend.';
  if (d.attending === 'yes') {
    if (!Number.isInteger(d.guests) || d.guests < 1 || d.guests > wedding.rsvp.maxGuests)
      e.guests = `Please choose between 1 and ${wedding.rsvp.maxGuests} guests.`;
    for (let i = 0; i < d.guests - 1; i++) {
      if (!(d.guestNames[i] ?? '').trim()) e[`guest-${i}`] = 'Please enter this guest’s full name.';
    }
    if (!d.meal) e.meal = 'Please choose a meal preference.';
    if (eventOn('welcome') && !d.welcomeEvent) e.welcomeEvent = 'Please choose yes or no.';
    if (eventOn('farewell') && !d.farewellBrunch) e.farewellBrunch = 'Please choose yes or no.';
  }
  if (d.message.length > 1000) e.message = 'Please keep your message under 1000 characters.';
  if (d.song.length > 200) e.song = 'Please keep this under 200 characters.';
  if (d.dietary.length > 500) e.dietary = 'Please keep this under 500 characters.';
  return e;
}

/** Datensatz, wie er gespeichert wird (Spaltennamen = supabase/rsvp.sql) */
export function toRecord(d: RsvpData) {
  const yes = d.attending === 'yes';
  return {
    first_name: d.firstName.trim(),
    last_name: d.lastName.trim(),
    attending: yes,
    guests: yes ? d.guests : 0,
    guest_names: yes ? d.guestNames.slice(0, d.guests - 1).map((s) => s.trim()) : [],
    meal: yes ? d.meal : null,
    dietary: yes ? d.dietary.trim() || null : null,
    welcome_event: yes && eventOn('welcome') ? d.welcomeEvent === 'yes' : null,
    farewell_brunch: yes && eventOn('farewell') ? d.farewellBrunch === 'yes' : null,
    song_request: yes ? d.song.trim() || null : null,
    message: d.message.trim() || null,
    submitted_at: new Date().toISOString(),
  };
}

/** Lesbare Zusammenfassung (für WhatsApp / E-Mail / Kopieren) */
export function summary(d: RsvpData) {
  const yes = d.attending === 'yes';
  const L = [`RSVP — ${wedding.couple.first} & ${wedding.couple.second}`, '', `Name: ${d.firstName.trim()} ${d.lastName.trim()}`,
    `Attending: ${yes ? 'Joyfully accepts' : 'Regretfully declines'}`];
  if (yes) {
    L.push(`Guests: ${d.guests}`);
    const others = d.guestNames.slice(0, d.guests - 1).filter(Boolean);
    if (others.length) L.push(`Guest names: ${others.join(', ')}`);
    L.push(`Meal: ${d.meal}`);
    if (d.dietary.trim()) L.push(`Dietary: ${d.dietary.trim()}`);
    if (eventOn('welcome')) L.push(`Welcome event: ${d.welcomeEvent}`);
    if (eventOn('farewell')) L.push(`Farewell brunch: ${d.farewellBrunch}`);
    if (d.song.trim()) L.push(`Song request: ${d.song.trim()}`);
  }
  if (d.message.trim()) L.push('', `Message: ${d.message.trim()}`);
  return L.join('\n');
}

async function post(url: string, body: unknown, headers: Record<string, string>): Promise<SubmitResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` };
    return { status: 'saved' };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Network error' };
  } finally {
    clearTimeout(timer);
  }
}

export async function submitRsvp(d: RsvpData): Promise<SubmitResult> {
  const r = wedding.rsvp;
  const record = toRecord(d);
  if (r.provider === 'supabase' && r.supabaseUrl && r.supabaseAnonKey) {
    return post(`${r.supabaseUrl.replace(/\/$/, '')}/rest/v1/${r.table}`, record, {
      apikey: r.supabaseAnonKey,
      Authorization: `Bearer ${r.supabaseAnonKey}`,
      Prefer: 'return=minimal',
    });
  }
  if (r.provider === 'webhook' && r.webhookUrl) {
    return post(r.webhookUrl, record, { Accept: 'application/json' });
  }
  // Nichts verbunden → ehrlich melden
  await new Promise((res) => setTimeout(res, 700));
  return { status: 'not-configured' };
}
