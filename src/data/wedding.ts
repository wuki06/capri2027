/* ════════════════════════════════════════════════════════════════════
   MELEK & ALESSIO — CAPRI 2027
   ────────────────────────────────────────────────────────────────────
   ALLE veränderbaren Daten der Einladung stehen in DIESER Datei.
   Texte gibt es zweimal:  de: 'Deutsch',  tr: 'Türkçe'

   Bilder:  Datei mit dem hier genannten Namen nach  public/assets/<ordner>/
            hochladen (Endung egal: .jpg .png .webp) — wird automatisch erkannt.
            Keine Datei vorhanden  →  die gezeichnete Illustration wird genutzt.

   Sprache: Link mit  ?lang=tr  öffnet direkt auf Türkisch,  ?lang=de  auf Deutsch.

   Markierung  ⟵ PLATZHALTER  = muss später noch ersetzt werden.
   ════════════════════════════════════════════════════════════════════ */
import type { L } from '../lib/i18n';

export const wedding = {
  /* ── Website / WhatsApp-Vorschau ───────────────────────────────── */
  site: {
    // Öffentliche Adresse nach dem Deploy, OHNE Schrägstrich am Ende.
    // Wichtig für das WhatsApp-Vorschaubild.  ⟵ PLATZHALTER
    url: '',
    title: 'Melek & Alessio — Capri 2027',
    description:
      'Melek & Alessio heiraten auf Capri · 10. Juli 2027 — Melek & Alessio Capri’de evleniyor · 10 Temmuz 2027',
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
  place: { city: 'Capri', country: 'Italia' },

  /* ── Fotos der Szenen ──────────────────────────────────────────────
     Einfach eine Datei mit GENAU diesem Namen in den Ordner hochladen
     (Endung egal: .jpg .png .webp). Fehlt die Datei, bleibt die Zeichnung. */
  images: {
    hero: '/assets/capri/hero', //           Startbild
    benvenuti: '/assets/capri/benvenuti', // Benvenuti-Szene
    sunset: '/assets/capri/sunset', //       Golden Hour / Sonnenuntergang
    night: '/assets/capri/night', //         dieselbe Ansicht am Abend (optional)
  },

  /* Der Countdown läuft bis zu diesem Programmpunkt (id aus timeline). */
  countdownTo: 'ceremony',

  /* ── Tagesablauf — Zeiten hier ändern ───────────────────────────── */
  timeline: [
    { id: 'arrival', time: '15:30', icon: 'glass',
      title: { de: 'Ankunft', tr: 'Karşılama' },
      text: { de: 'Willkommensdrinks & Live-Musik', tr: 'Hoş geldin içecekleri & canlı müzik' } },
    { id: 'ceremony', time: '16:00', icon: 'rings',
      title: { de: 'Trauung', tr: 'Nikâh' },
      text: { de: 'Der Beginn von für immer', tr: 'Sonsuzluğun başlangıcı' } },
    { id: 'aperitivo', time: '17:00', icon: 'lemon',
      title: { de: 'Aperitivo', tr: 'Aperitivo' },
      text: { de: 'Italienischer Aperitivo mit Blick aufs Mittelmeer', tr: 'Akdeniz manzarasında İtalyan aperitivosu' } },
    { id: 'dinner', time: '18:30', icon: 'candle',
      title: { de: 'Abendessen', tr: 'Akşam Yemeği' },
      text: { de: 'Dinner unter dem Himmel von Capri', tr: 'Capri göğü altında akşam yemeği' } },
    { id: 'first-dance', time: '21:00', icon: 'heart',
      title: { de: 'Eröffnungstanz', tr: 'İlk Dans' },
      text: { de: '', tr: '' } },
    { id: 'celebration', time: '21:30', icon: 'music',
      title: { de: 'Party', tr: 'Kutlama' },
      text: { de: 'Live-Musik · Tanz · Cocktails', tr: 'Canlı müzik · Dans · Kokteyller' } },
    { id: 'midnight', time: '00:00', icon: 'moon',
      title: { de: 'Mitternacht', tr: 'Gece Yarısı' },
      text: { de: 'Und die Nacht geht weiter …', tr: 'Ve gece devam ediyor…' } },
  ] as TimelineItem[],

  /* ── Location — noch nicht festgelegt ───────────────────────────── */
  venue: {
    // Sobald "name" ausgefüllt ist, wird automatisch die echte Location gezeigt.
    name: '', // z. B. 'Villa …'                         ⟵ PLATZHALTER
    address: '', // z. B. 'Via …, 80073 Capri NA, Italia' ⟵ PLATZHALTER
    mapsUrl: '', // Google-Maps-Link                        ⟵ PLATZHALTER
    coordinates: null as null | { lat: number; lng: number },
    photo: '/assets/venue/venue', // Datei: public/assets/venue/venue.jpg (später durch echtes Foto ersetzen)
    description: { de: '', tr: '' } as L, // optionaler Text zur echten Location
  },

  /* ── Musik ─────────────────────────────────────────────────────── */
  music: {
    // Hintergrundmusik — startet NIE automatisch, nur nach Antippen.
    // Datei hochladen: public/assets/music/song.mp3 (oder .m4a)
    src: '/assets/music/song',
    volume: 0.55,
    fadeInMs: 2400,
    // true = Musik-Button wird auch ohne Datei angezeigt (nur zur Vorschau).
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
    // Die drei Wörter werden wie in einem Modemagazin untereinander gesetzt.
    title: { de: 'Italienische Sommer Eleganz', tr: 'İtalyan Yaz Zarafeti' } as L,
    lines: { de: ['Kleidet euch wunderschön.', 'Feiert ausgelassen.'], tr: ['Şık giyinin.', 'Doyasıya kutlayın.'] } as L<string[]>,
    palette: [
      { hex: '#E6D3AE', name: { de: 'Champagner', tr: 'Şampanya' } },
      { hex: '#F3EAD8', name: { de: 'Creme', tr: 'Krem' } },
      { hex: '#D6BE98', name: { de: 'Warmer Sand', tr: 'Sıcak Kum' } },
      { hex: '#7A7A4E', name: { de: 'Oliv', tr: 'Zeytin Yeşili' } },
      { hex: '#A7B196', name: { de: 'Salbei', tr: 'Adaçayı' } },
      { hex: '#DDB7AA', name: { de: 'Zartrosa', tr: 'Pudra Pembe' } },
      { hex: '#44698A', name: { de: 'Mittelmeerblau', tr: 'Akdeniz Mavisi' } },
    ] as { hex: string; name: L }[],
    // Outfit-Inspirationen: public/assets/couple/look-1.jpg … look-4.jpg
    inspiration: ['/assets/couple/look-1', '/assets/couple/look-2', '/assets/couple/look-3', '/assets/couple/look-4'] as string[],
  },

  /* ── Capri-Wochenende — enabled: false blendet ein Event aus ───── */
  weekend: {
    enabled: true,
    events: [
      { id: 'welcome', enabled: true, date: '2027-07-09',
        kicker: { de: 'Willkommen auf Capri', tr: 'Capri’ye hoş geldiniz' },
        title: { de: 'Willkommensabend', tr: 'Karşılama Akşamı' },
        text: { de: 'Details folgen.', tr: 'Detaylar yakında.' },
        rsvpQuestion: { de: 'Willkommensabend', tr: 'Karşılama akşamı' } },
      { id: 'wedding', enabled: true, date: '2027-07-10',
        kicker: { de: 'Melek & Alessio', tr: 'Melek & Alessio' },
        title: { de: 'Die Hochzeit', tr: 'Düğün' },
        text: { de: '', tr: '' },
        rsvpQuestion: { de: '', tr: '' } },
      { id: 'farewell', enabled: true, date: '2027-07-11',
        kicker: { de: 'Arrivederci', tr: 'Arrivederci' },
        title: { de: 'Abschiedsbrunch', tr: 'Veda Brunch’ı' },
        text: { de: 'Details folgen.', tr: 'Detaylar yakında.' },
        rsvpQuestion: { de: 'Abschiedsbrunch', tr: 'Veda brunch’ı' } },
    ] as WeekendEvent[],
  },

  /* ── Anreise — leere details = „Details folgen“ ───────────────── */
  travel: [
    { id: 'naples', title: { de: 'Ankunft in Neapel', tr: 'Napoli’ye Varış' }, details: { de: [], tr: [] } },
    { id: 'naples-capri', title: { de: 'Neapel → Capri', tr: 'Napoli → Capri' }, details: { de: [], tr: [] } },
    { id: 'ferry', title: { de: 'Fähre / Tragflügelboot', tr: 'Feribot / Deniz Otobüsü' }, details: { de: [], tr: [] } },
    { id: 'transfer', title: { de: 'Transfer', tr: 'Transfer' }, details: { de: [], tr: [] } },
    { id: 'stay', title: { de: 'Unterkunft', tr: 'Konaklama' }, details: { de: [], tr: [] } },
  ] as TravelItem[],

  /* ── RSVP ─────────────────────────────────────────────────────── */
  rsvp: {
    deadline: '2027-06-01',
    maxGuests: 4, // inkl. der antwortenden Person
    meals: [
      { id: 'meat', de: 'Fleisch', tr: 'Et' },
      { id: 'fish', de: 'Fisch', tr: 'Balık' },
      { id: 'vegetarian', de: 'Vegetarisch', tr: 'Vejetaryen' },
      { id: 'vegan', de: 'Vegan', tr: 'Vegan' },
    ],
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
    whatsappNumber: '436801576484', // internationales Format ohne +, z. B. '352621000000'  ⟵ PLATZHALTER
    email: '', //                                                              ⟵ PLATZHALTER
  },

  /* ── Texte ─────────────────────────────────────────────────────── */
  text: {
    loader: 'Capri',
    loading: { de: 'Die Einladung wird geladen', tr: 'Davetiye yükleniyor' },
    skip: { de: 'Direkt zur Antwort', tr: 'Doğrudan yanıta geç' },
    envelope: {
      line1: { de: 'Eine Einladung wartet auf euch', tr: 'Sizi bir davet bekliyor' },
      cta: { de: 'Zum Öffnen tippen', tr: 'Açmak için dokunun' },
      aria: { de: 'Einladung öffnen', tr: 'Daveti aç' },
    },
    hero: {
      top: { de: 'Gemeinsam mit ihren Familien', tr: 'Aileleriyle birlikte' },
      invite: { de: ['laden euch herzlich ein,', 'ihre Hochzeit zu feiern'], tr: ['sizleri düğünlerine', 'davet etmekten mutluluk duyar'] } as L<string[]>,
      cue: { de: 'Scrollen & entdecken', tr: 'Keşfetmek için kaydırın' },
    },
    musicPrompt: {
      line: { de: 'Mit Musik erleben', tr: 'Müzikle deneyimleyin' },
      button: { de: 'Musik abspielen', tr: 'Müziği başlat' },
      skip: { de: 'Nicht jetzt', tr: 'Şimdi değil' },
      play: { de: 'Musik abspielen', tr: 'Müziği başlat' },
      pause: { de: 'Musik pausieren', tr: 'Müziği durdur' },
    },
    saveTheDate: {
      title: { de: 'Merkt euch den Tag', tr: 'Bu tarihi ayırın' },
      lines: { de: ['Wir können es kaum erwarten,', 'diesen unvergesslichen Tag mit euch zu feiern.'], tr: ['Bu unutulmaz günü sizinle', 'kutlamak için sabırsızlanıyoruz.'] } as L<string[]>,
      units: { de: ['Tage', 'Stunden', 'Minuten', 'Sekunden'], tr: ['Gün', 'Saat', 'Dakika', 'Saniye'] } as L<string[]>,
      after: { de: 'Heute sagen wir „Ja“.', tr: 'Bugün „Evet“ diyoruz.' },
      aria: { de: 'Countdown bis zur Hochzeit', tr: 'Düğüne geri sayım' },
    },
    benvenuti: {
      title: 'Benvenuti a Capri',
      lines: {
        de: ['Wo das Mittelmeer den Himmel berührt,', 'feiern wir mit euch die Liebe,', 'die Familie und la dolce vita.'],
        tr: ['Akdeniz’in gökyüzüyle buluştuğu yerde,', 'aşkı, aileyi ve la dolce vita’yı', 'sizinle birlikte kutlamak istiyoruz.'],
      } as L<string[]>,
    },
    venue: {
      kicker: { de: 'Die Location', tr: 'Mekân' },
      placeholderTitle: { de: ['Ein Traumort', 'auf Capri'], tr: ['Capri’de', 'rüya gibi bir mekân'] } as L<string[]>,
      placeholderText: {
        de: ['Ein atemberaubender Ort, an dem das Mittelmeer auf zeitlose Schönheit trifft.', 'Umgeben von Natur, Meer und Liebe – der perfekte Rahmen für unser „Ja“.'],
        tr: ['Akdeniz’in zamansız güzellikle buluştuğu nefes kesici bir yer.', 'Doğa, deniz ve sevgiyle çevrili – „Evet“imiz için kusursuz bir ortam.'],
      } as L<string[]>,
      mapsButton: { de: 'In Karten öffnen', tr: 'Haritada aç' },
      soon: { de: 'Der genaue Ort wird bald verraten.', tr: 'Mekânın tam yeri yakında açıklanacak.' },
      alt: { de: 'Ein Traumort auf Capri', tr: 'Capri’de rüya gibi bir mekân' },
    },
    music: {
      kicker: { de: 'Live auf Capri', tr: 'Capri’de canlı' },
      lines: { de: ['Drei Sprachen.', 'Zwei Kulturen.', 'Eine unvergessliche Nacht.'], tr: ['Üç dil.', 'İki kültür.', 'Unutulmaz bir gece.'] } as L<string[]>,
      footer: { de: ['Live-Musik', 'unter italienischem Himmel'], tr: ['İtalyan göğü altında', 'canlı müzik'] } as L<string[]>,
      band: { de: 'Live-Band', tr: 'Canlı grup' },
    },
    weddingDay: { title: { de: 'Der Hochzeitstag', tr: 'Düğün Günü' } },
    dressCode: { kicker: { de: 'Dresscode', tr: 'Kıyafet Kuralı' }, palette: { de: 'Farbinspiration', tr: 'Renk ilhamı' }, look: { de: 'Outfit-Inspiration', tr: 'Kıyafet ilhamı' } },
    weekend: { title: { de: 'Das Capri-Wochenende', tr: 'Capri Hafta Sonu' } },
    travel: { title: { de: 'Eure Anreise nach Capri', tr: 'Capri’ye Yolculuğunuz' }, soon: { de: 'Details folgen.', tr: 'Detaylar yakında.' } },
    missing: { de: ['Das Einzige, was noch fehlt,', 'seid ihr.'], tr: ['Eksik olan tek şey', 'sizsiniz.'] } as L<string[]>,
    rsvp: {
      title: { de: 'Seid ihr dabei?', tr: 'Bize katılacak mısınız?' },
      replyBy: { de: 'Bitte antwortet bis zum', tr: 'Lütfen şu tarihe kadar yanıtlayın' },
      submit: { de: 'Antwort senden', tr: 'Yanıtı gönder' },
      sending: { de: 'Wird gesendet …', tr: 'Gönderiliyor…' },
      firstName: { de: 'Vorname', tr: 'Ad' },
      lastName: { de: 'Nachname', tr: 'Soyad' },
      attend: { de: 'Teilnahme', tr: 'Katılım' },
      yes: { de: 'Ja, ich komme gerne', tr: 'Memnuniyetle katılıyorum' },
      no: { de: 'Leider kann ich nicht', tr: 'Maalesef katılamıyorum' },
      guests: { de: 'Anzahl der Personen', tr: 'Kişi sayısı' },
      guestNames: { de: 'Namen der Begleitpersonen', tr: 'Diğer misafirlerin isimleri' },
      guestN: { de: 'Person {n} – vollständiger Name', tr: '{n}. kişi – ad soyad' },
      less: { de: 'Eine Person weniger', tr: 'Bir kişi eksik' },
      more: { de: 'Eine Person mehr', tr: 'Bir kişi fazla' },
      meal: { de: 'Menüwunsch', tr: 'Menü tercihi' },
      dietary: { de: 'Allergien / Unverträglichkeiten', tr: 'Alerjiler / beslenme hassasiyetleri' },
      optional: { de: '(optional)', tr: '(isteğe bağlı)' },
      yesShort: { de: 'Ja', tr: 'Evet' },
      noShort: { de: 'Nein', tr: 'Hayır' },
      song: { de: 'Musikwunsch', tr: 'Şarkı isteği' },
      songPlaceholder: { de: 'Ein Lied, bei dem ihr tanzen müsst', tr: 'Sizi dansa kaldıracak bir şarkı' },
      message: { de: 'Nachricht an Melek & Alessio', tr: 'Melek & Alessio’ya mesajınız' },
      whatsapp: { de: 'Per WhatsApp senden', tr: 'WhatsApp ile gönder' },
      email: { de: 'Per E-Mail senden', tr: 'E-posta ile gönder' },
      copy: { de: 'Antwort kopieren', tr: 'Yanıtı kopyala' },
      copied: { de: 'Kopiert', tr: 'Kopyalandı' },
      thanksYes: { de: ['Grazie mille!', 'Wir freuen uns riesig, dass ihr mit uns auf Capri feiert.'], tr: ['Grazie mille!', 'Capri’de bizimle olacağınız için çok mutluyuz.'] } as L<string[]>,
      thanksNo: { de: ['Grazie mille.', 'Ihr werdet uns sehr fehlen – danke für eure Rückmeldung.'], tr: ['Grazie mille.', 'Sizi çok özleyeceğiz – haber verdiğiniz için teşekkür ederiz.'] } as L<string[]>,
      notConnected: {
        de: 'Online-Antworten sind noch nicht verbunden – eure Antwort wurde NICHT gesendet. Bitte schickt sie uns direkt:',
        tr: 'Çevrimiçi yanıtlar henüz bağlı değil – yanıtınız GÖNDERİLMEDİ. Lütfen bize doğrudan iletin:',
      },
      error: {
        de: 'Eure Antwort konnte nicht gesendet werden. Bitte Verbindung prüfen und erneut versuchen.',
        tr: 'Yanıtınız gönderilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.',
      },
    },
    finale: {
      lines: { de: ['Ein Tag.', 'Eine Insel.', 'Für immer.'], tr: ['Bir gün.', 'Bir ada.', 'Sonsuza dek.'] } as L<string[]>,
      see: { de: 'Wir sehen uns auf Capri', tr: 'Capri’de görüşmek üzere' },
      forever: { de: 'Für immer beginnt hier.', tr: 'Sonsuzluk burada başlıyor.' },
      replay: { de: 'Einladung erneut ansehen', tr: 'Daveti yeniden izle' },
    },
  },
};

/* ── Typen (nicht ändern) ─────────────────────────────────────────── */
export type TimelineIcon = 'glass' | 'rings' | 'lemon' | 'candle' | 'heart' | 'music' | 'moon';
export interface TimelineItem { id: string; time: string; icon: TimelineIcon; title: L; text: L }
export interface WeekendEvent { id: string; enabled: boolean; date: string; kicker: L; title: L; text: L; rsvpQuestion: L }
export interface TravelItem { id: string; title: L; details: L<string[]> }
export type Wedding = typeof wedding;
