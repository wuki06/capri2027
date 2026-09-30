/* ─────────────────────────────────────────────────────────────────────
   RSVP-Service — austauschbare Speicherung
   provider: 'none' | 'supabase' | 'webhook'   (in wedding.ts)
   Regel: Es wird NIEMALS „gespeichert“ angezeigt, wenn nichts gespeichert wurde.
   ───────────────────────────────────────────────────────────────────── */
import { wedding } from '../data/wedding';
import type { Lang } from './i18n';

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

const MSG = {
  de: {
    first: 'Bitte Vornamen eingeben.', last: 'Bitte Nachnamen eingeben.', letters: 'Bitte nur Buchstaben verwenden.',
    attend: 'Bitte Teilnahme auswählen.', guests: (n: number) => `Bitte zwischen 1 und ${n} Personen wählen.`,
    guest: 'Bitte vollständigen Namen eingeben.', meal: 'Bitte Menüwunsch auswählen.', yesno: 'Bitte Ja oder Nein wählen.',
    max: (n: number) => `Bitte höchstens ${n} Zeichen.`,
  },
  tr: {
    first: 'Lütfen adınızı girin.', last: 'Lütfen soyadınızı girin.', letters: 'Lütfen yalnızca harf kullanın.',
    attend: 'Lütfen katılım durumunuzu seçin.', guests: (n: number) => `Lütfen 1 ile ${n} kişi arasında seçin.`,
    guest: 'Lütfen ad soyad girin.', meal: 'Lütfen menü tercihinizi seçin.', yesno: 'Lütfen Evet veya Hayır seçin.',
    max: (n: number) => `Lütfen en fazla ${n} karakter kullanın.`,
  },
};

export function validate(d: RsvpData, lang: Lang): Errors {
  const m = MSG[lang];
  const e: Errors = {};
  const name = /^[\p{L}\p{M}' .-]{1,60}$/u;
  if (!d.firstName.trim()) e.firstName = m.first;
  else if (!name.test(d.firstName.trim())) e.firstName = m.letters;
  if (!d.lastName.trim()) e.lastName = m.last;
  else if (!name.test(d.lastName.trim())) e.lastName = m.letters;
  if (!d.attending) e.attending = m.attend;
  if (d.attending === 'yes') {
    if (!Number.isInteger(d.guests) || d.guests < 1 || d.guests > wedding.rsvp.maxGuests) e.guests = m.guests(wedding.rsvp.maxGuests);
    for (let i = 0; i < d.guests - 1; i++) {
      if (!(d.guestNames[i] ?? '').trim()) e[`guest-${i}`] = m.guest;
    }
    if (!d.meal) e.meal = m.meal;
    if (eventOn('welcome') && !d.welcomeEvent) e.welcomeEvent = m.yesno;
    if (eventOn('farewell') && !d.farewellBrunch) e.farewellBrunch = m.yesno;
  }
  if (d.message.length > 1000) e.message = m.max(1000);
  if (d.song.length > 200) e.song = m.max(200);
  if (d.dietary.length > 500) e.dietary = m.max(500);
  return e;
}

/** Datensatz, wie er gespeichert wird (Spaltennamen = supabase/rsvp.sql) */
export function toRecord(d: RsvpData, lang: Lang) {
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
    language: lang,
    submitted_at: new Date().toISOString(),
  };
}

/** Lesbare Zusammenfassung (für WhatsApp / E-Mail / Kopieren) */
export function summary(d: RsvpData, lang: Lang) {
  const yes = d.attending === 'yes';
  const de = lang === 'de';
  const yn = (v: YesNo) => (v === 'yes' ? (de ? 'Ja' : 'Evet') : v === 'no' ? (de ? 'Nein' : 'Hayır') : '–');
  const meal = wedding.rsvp.meals.find((x) => x.id === d.meal);
  const L = [
    `${de ? 'Antwort' : 'Yanıt'} — ${wedding.couple.first} & ${wedding.couple.second}`, '',
    `${de ? 'Name' : 'Ad Soyad'}: ${d.firstName.trim()} ${d.lastName.trim()}`,
    `${de ? 'Teilnahme' : 'Katılım'}: ${yes ? (de ? 'Ja, ich komme gerne' : 'Memnuniyetle katılıyorum') : (de ? 'Leider kann ich nicht' : 'Maalesef katılamıyorum')}`,
  ];
  if (yes) {
    L.push(`${de ? 'Personen' : 'Kişi sayısı'}: ${d.guests}`);
    const others = d.guestNames.slice(0, d.guests - 1).filter(Boolean);
    if (others.length) L.push(`${de ? 'Begleitung' : 'Diğer misafirler'}: ${others.join(', ')}`);
    L.push(`${de ? 'Menü' : 'Menü'}: ${meal ? meal[lang] : d.meal}`);
    if (d.dietary.trim()) L.push(`${de ? 'Allergien' : 'Alerjiler'}: ${d.dietary.trim()}`);
    if (eventOn('welcome')) L.push(`${de ? 'Willkommensabend' : 'Karşılama akşamı'}: ${yn(d.welcomeEvent)}`);
    if (eventOn('farewell')) L.push(`${de ? 'Abschiedsbrunch' : 'Veda brunch’ı'}: ${yn(d.farewellBrunch)}`);
    if (d.song.trim()) L.push(`${de ? 'Musikwunsch' : 'Şarkı isteği'}: ${d.song.trim()}`);
  }
  if (d.message.trim()) L.push('', `${de ? 'Nachricht' : 'Mesaj'}: ${d.message.trim()}`);
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

export async function submitRsvp(d: RsvpData, lang: Lang): Promise<SubmitResult> {
  const r = wedding.rsvp;
  const record = toRecord(d, lang);
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
