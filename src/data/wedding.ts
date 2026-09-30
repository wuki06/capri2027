/* ════════════════════════════════════════════════════════════════════
   MELEK & ALESSIO — CAPRI 2027
   ────────────────────────────────────────────────────────────────────
   ALLE veränderbaren Daten der Einladung stehen in DIESER Datei.
   Nichts anderes muss angepasst werden.

   Bilder:  Datei mit dem hier genannten Namen nach  public/assets/<ordner>/
            hochladen (Endung egal: .jpg .png .webp) — wird automatisch erkannt.
            Keine Datei vorhanden  →  die gezeichnete Illustration wird genutzt.

   Markierung  ⟵ PLATZHALTER  = muss später noch ersetzt werden.
   ════════════════════════════════════════════════════════════════════ */

export const wedding = {
  /* ── Website / WhatsApp-Vorschau ───────────────────────────────── */
  site: {
    // Öffentliche Adresse nach dem Deploy, OHNE Schrägstrich am Ende.
    // Wichtig für das WhatsApp-Vorschaubild.  ⟵ PLATZHALTER
    url: '',
    title: 'Melek & Alessio — Capri 2027',
    description:
      'Together with their families, Melek & Alessio invite you to celebrate their wedding in Capri, Italy. 10 July 2027.',
    ogImage: '/og-image.jpg', // 1200 × 630 px
    themeColor: '#F4ECDD',
  },

  /* ── Das Paar ───────────────────────────────────────────────────── */
  couple: {
    first: 'Melek',
    second: 'Alessio',
    monogram: { left: 'M', right: 'A' },
  },

  /* ── Datum & Ort ────────────────────────────────────────────────── */
  date: '2027-07-10', // JJJJ-MM-TT
  utcOffset: '+02:00', // Sommerzeit Italien (CEST)
  place: { city: 'Capri', country: 'Italia', countryEn: 'Italy' },

  /* ── Fotos der Szenen ──────────────────────────────────────────────
     Einfach eine Datei mit GENAU diesem Namen in den Ordner hochladen
     (Endung egal: .jpg .png .webp). Fehlt die Datei, bleibt die Zeichnung. */
  images: {
    hero: '/assets/capri/hero', //           Capri bei Tag (Startbild)
    benvenuti: '/assets/capri/benvenuti', // Blick von der Terrasse
    sunset: '/assets/capri/sunset', //       Golden Hour / Sonnenuntergang
    night: '/assets/capri/night', //         dieselbe Ansicht am Abend (optional)
  },

  /* Der Countdown läuft bis zu diesem Programmpunkt (id aus timeline). */
  countdownTo: 'ceremony',

  /* ── Tagesablauf — Zeiten hier ändern ───────────────────────────── */
  timeline: [
    { id: 'arrival', time: '15:30', title: 'Arrival', text: 'Welcome drinks & live music', icon: 'glass' },
    { id: 'ceremony', time: '16:00', title: 'Ceremony', text: 'The beginning of forever', icon: 'rings' },
    { id: 'aperitivo', time: '17:00', title: 'Aperitivo', text: 'Italian aperitivo overlooking the Mediterranean', icon: 'lemon' },
    { id: 'dinner', time: '18:30', title: 'Dinner', text: 'Dinner beneath the Capri sky', icon: 'candle' },
    { id: 'first-dance', time: '21:00', title: 'First Dance', text: '', icon: 'heart' },
    { id: 'celebration', time: '21:30', title: 'Celebration', text: 'Live music · Dancing · Cocktails', icon: 'music' },
    { id: 'midnight', time: '00:00', title: 'Midnight', text: 'And the night continues…', icon: 'moon' },
  ] as TimelineItem[],

  /* ── Location — noch nicht festgelegt ───────────────────────────── */
  venue: {
    // Sobald "name" ausgefüllt ist, wird automatisch die echte Location gezeigt.
    name: '', // z. B. 'Villa …'                         ⟵ PLATZHALTER
    address: '', // z. B. 'Via …, 80073 Capri NA, Italy'  ⟵ PLATZHALTER
    mapsUrl: '', // Google-Maps-Link                        ⟵ PLATZHALTER
    coordinates: null as null | { lat: number; lng: number },
    photo: '/assets/venue/venue', // Datei: public/assets/venue/venue.jpg (später durch echtes Foto ersetzen)
    description: '', // optionaler Text zur echten Location
  },

  /* ── Musik ─────────────────────────────────────────────────────── */
  music: {
    // Hintergrundmusik — startet NIE automatisch, nur nach Antippen.
    // Datei hochladen: public/assets/music/song.mp3 (oder .m4a)
    src: '/assets/music/song',
    title: '', // optional, z. B. 'PARALLEL — Live in Capri'
    volume: 0.55,
    fadeInMs: 2400,
    // true = Musik-Button wird auch ohne Datei angezeigt (nur zur Vorschau).
    // Vor dem Versand an Gäste: song.mp3 hochladen ODER auf false setzen.
    showWithoutFile: true,
  },

  /* ── Mikro-Details ─────────────────────────────────────────────── */
  effects: {
    envelopeSound: true, // sehr leiser Papier-/Siegel-Klang, nur nach Antippen
    haptics: true, // kurze Vibration bei Buttons (Android; iOS ignoriert dies)
  },

  /* ── Live-Band ─────────────────────────────────────────────────── */
  band: {
    name: 'PARALLEL',
    languages: ['Italiano', 'Türkçe', 'Deutsch'],
    photo: '/assets/music/band', // Datei: public/assets/music/band.jpg
    instagram: '', // 'https://instagram.com/…'          ⟵ PLATZHALTER
    spotify: '', // 'https://open.spotify.com/artist/…'  ⟵ PLATZHALTER
  },

  /* ── Dress Code ────────────────────────────────────────────────── */
  dressCode: {
    title: 'Italian Summer Elegance',
    lines: ['Dress beautifully.', 'Celebrate freely.'],
    palette: [
      { name: 'Champagne', hex: '#E6D3AE' },
      { name: 'Cream', hex: '#F3EAD8' },
      { name: 'Warm Sand', hex: '#D6BE98' },
      { name: 'Olive', hex: '#7A7A4E' },
      { name: 'Sage', hex: '#A7B196' },
      { name: 'Soft Rose', hex: '#DDB7AA' },
      { name: 'Mediterranean Blue', hex: '#44698A' },
    ],
    // Optionale Outfit-Inspirationen: public/assets/couple/look-1.jpg … look-4.jpg
    inspiration: ['/assets/couple/look-1', '/assets/couple/look-2', '/assets/couple/look-3', '/assets/couple/look-4'] as string[],
  },

  /* ── Capri Weekend — enabled: false blendet ein Event aus ──────── */
  weekend: {
    enabled: true,
    events: [
      { id: 'welcome', enabled: true, date: '2027-07-09', kicker: 'Welcome to Capri', title: 'Welcome Evening', text: 'Details to follow.', rsvpQuestion: 'Welcome event' },
      { id: 'wedding', enabled: true, date: '2027-07-10', kicker: 'Melek & Alessio', title: 'The Wedding', text: '', rsvpQuestion: '' },
      { id: 'farewell', enabled: true, date: '2027-07-11', kicker: 'Arrivederci', title: 'Farewell Brunch', text: 'Details to follow.', rsvpQuestion: 'Farewell brunch' },
    ] as WeekendEvent[],
  },

  /* ── Anreise — leere details = „Details to follow“ ─────────────── */
  travel: [
    { id: 'naples', title: 'Arriving in Naples', details: [] as string[] },
    { id: 'naples-capri', title: 'Naples → Capri', details: [] as string[] },
    { id: 'ferry', title: 'Ferry / Hydrofoil', details: [] as string[] },
    { id: 'transfer', title: 'Transfer', details: [] as string[] },
    { id: 'stay', title: 'Accommodation', details: [] as string[] },
  ] as TravelItem[],

  /* ── RSVP ─────────────────────────────────────────────────────── */
  rsvp: {
    deadline: '2027-06-01',
    maxGuests: 4, // inkl. der antwortenden Person
    meals: ['Meat', 'Fish', 'Vegetarian', 'Vegan'],
    /* Speicherung der Antworten:
       'none'     → noch nicht verbunden (es wird EHRLICH angezeigt, dass nichts gespeichert wurde)
       'supabase' → supabaseUrl + supabaseAnonKey + table ausfüllen (SQL: supabase/rsvp.sql)
       'webhook'  → webhookUrl (z. B. Formspree, Make, Zapier, eigener Endpoint)            */
    provider: 'none' as 'none' | 'supabase' | 'webhook',
    supabaseUrl: '',
    supabaseAnonKey: '',
    table: 'rsvps',
    webhookUrl: '',
    // Ausweichweg, solange keine Datenbank verbunden ist:
    whatsappNumber: '', // internationales Format ohne +, z. B. '352621000000'  ⟵ PLATZHALTER
    email: '', //                                                              ⟵ PLATZHALTER
  },

  /* ── Texte ─────────────────────────────────────────────────────── */
  text: {
    loader: 'Capri',
    envelope: { line1: 'An invitation awaits you', cta: 'Tap to open' },
    hero: {
      top: 'Together with their families',
      invite: ['Invite you to celebrate', 'their wedding'],
      cue: 'Scroll to discover',
    },
    musicPrompt: { line: 'Experience with music', button: 'Play music' },
    saveTheDate: {
      title: 'Save the date',
      lines: ['We cannot wait to celebrate', 'this unforgettable day with you.'],
      units: ['Days', 'Hours', 'Minutes', 'Seconds'],
      after: 'Today we say “I do”.',
    },
    benvenuti: {
      title: 'Benvenuti a Capri',
      lines: ['Where the Mediterranean meets the sky,', 'we invite you to join us for a celebration', 'of love, family and la dolce vita.'],
    },
    venue: {
      kicker: 'The Venue',
      placeholderTitle: ['A dream location', 'in Capri'],
      placeholderText: [
        'A breathtaking place where the Mediterranean meets timeless beauty.',
        'Surrounded by nature, sea and love — the perfect setting for our “I do.”',
      ],
      mapsButton: 'Open in Maps',
      soon: 'The exact location will be revealed soon.',
    },
    music: {
      kicker: 'Live in Capri',
      lines: ['Three languages.', 'Two cultures.', 'One unforgettable night.'],
      footer: ['Live music', 'under the Italian sky'],
    },
    weddingDay: { title: 'The Wedding Day' },
    dressCode: { kicker: 'Dress Code' },
    weekend: { title: 'The Capri Weekend' },
    travel: { title: 'Your Journey to Capri', soon: 'Details to follow.' },
    missing: ['The only thing missing', 'is you.'],
    rsvp: {
      title: 'Will you join us?',
      replyBy: 'Kindly reply by',
      submit: 'Submit RSVP',
      thanksYes: ['Grazie mille!', 'We are overjoyed that you will be with us in Capri.'],
      thanksNo: ['Grazie mille.', 'You will be dearly missed — thank you for letting us know.'],
      notConnected:
        'Online replies are not connected yet — your answer has NOT been sent. Please send it to us directly:',
      error: 'Your reply could not be sent. Please check your connection and try again.',
    },
    finale: {
      lines: ['One day.', 'One island.', 'One forever.'],
      see: 'See you in Capri',
      forever: 'Forever starts here.',
      replay: 'Replay invitation',
    },
  },
};

/* ── Typen (nicht ändern) ─────────────────────────────────────────── */
export type TimelineIcon = 'glass' | 'rings' | 'lemon' | 'candle' | 'heart' | 'music' | 'moon';
export interface TimelineItem { id: string; time: string; title: string; text: string; icon: TimelineIcon }
export interface WeekendEvent { id: string; enabled: boolean; date: string; kicker: string; title: string; text: string; rsvpQuestion: string }
export interface TravelItem { id: string; title: string; details: string[] }
export type Wedding = typeof wedding;
