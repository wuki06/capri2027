// Domino-Kettenreaktion mit wachsenden Steinen (Faktor 1,5 – Whitehead 1983).
// Jeder Stein: starrer Quader, kippt um seine vordere Unterkante.
//   θ'' = 3g (h·sinθ − t·cosθ) / (2 (h² + t²))     (RK4)
// Kontakt, sobald die Spitze die Rückseite des nächsten Steins erreicht (h·sinθ = Abstand).
// Danach lehnt der Stein am nächsten: θ_i = φ + asin(gap·cosφ / h_i), φ = Winkel des nächsten Steins.

export const G = 9.81;
export const N = 29;
export const H0 = 0.005;
export const RATIO = 1.5;
export const T_RATIO = 0.17; // Dicke / Höhe
export const W_RATIO = 0.5; // Breite / Höhe
export const GAP_RATIO = 0.6; // Abstand / Höhe

export type Domino = {h: number; t: number; w: number; gap: number; xBack: number; pivot: number; trigger: number; omega0: number; free: number[]; dtS: number};

export const simulateChain = () => {
  const ds: Domino[] = [];
  let x = 0;
  for (let i = 0; i < N; i++) {
    const h = H0 * RATIO ** i;
    const t = h * T_RATIO;
    const d: Domino = {h, t, w: h * W_RATIO, gap: h * GAP_RATIO, xBack: x, pivot: x + t, trigger: 0, omega0: 0, free: [], dtS: 0};
    ds.push(d);
    x += t + d.gap;
  }
  let trig = 0;
  let omega = 0;
  for (let i = 0; i < N; i++) {
    const d = ds[i];
    const {h, t} = d;
    const acc = (th: number) => (3 * G * (h * Math.sin(th) - t * Math.cos(th))) / (2 * (h * h + t * t));
    // Mindest-Drehimpuls, um über den Kipppunkt (θ = atan(t/h)) zu kommen (Energieerhaltung) + Reserve
    const r = Math.hypot(h, t) / 2;
    const dE = G * (r - h / 2); // Höhengewinn des Schwerpunkts pro Masse
    const wMin = Math.sqrt((2 * dE * 3) / (h * h + t * t));
    if (i === 0) omega = wMin * 1.6;
    else omega = Math.max(omega, wMin * 1.25);
    d.trigger = trig;
    d.omega0 = omega;
    // Freie Bewegung bis zum Kontakt (bzw. beim letzten Stein bis zum Boden)
    const contact = i < N - 1 ? Math.asin(d.gap / h) : Math.PI / 2 - Math.atan(t / h) * 0.0;
    const dt = Math.sqrt(h / G) / 4000;
    const sampleEvery = 20;
    d.dtS = dt * sampleEvery;
    let th = 0;
    let w = omega;
    let k = 0;
    while (th < contact && k < 4e7) {
      if (k % sampleEvery === 0) d.free.push(th);
      const k1t = w, k1w = acc(th);
      const k2t = w + (dt / 2) * k1w, k2w = acc(th + (dt / 2) * k1t);
      const k3t = w + (dt / 2) * k2w, k3w = acc(th + (dt / 2) * k2t);
      const k4t = w + dt * k3w, k4w = acc(th + dt * k3t);
      th += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
      w += (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
      k++;
    }
    d.free.push(Math.min(th, contact));
    const tFall = k * dt;
    trig += tFall;
    // Impulsübertrag: Spitzengeschwindigkeit trifft den nächsten Stein auf Höhe h·cosθ
    if (i < N - 1) {
      const next = ds[i + 1];
      const vTip = w * h;
      const yc = h * Math.cos(contact);
      omega = (0.55 * vTip * yc * 3) / (next.h * next.h + next.t * next.t);
    }
    (d as any).tFall = tFall;
    (d as any).wEnd = w;
  }
  return ds;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const ds = simulateChain();
  for (const [i, d] of ds.entries())
    if (i % 4 === 0 || i > 24) console.log(i + 1, d.h.toFixed(3), 'm  Start', d.trigger.toFixed(3), 's  Kippdauer', (d as any).tFall.toFixed(3), 's  samples', d.free.length);
  const last = ds[N - 1];
  console.log('Kette fertig nach', (last.trigger + (last as any).tFall).toFixed(2), 's · Länge', (last.pivot).toFixed(1), 'm');
}
