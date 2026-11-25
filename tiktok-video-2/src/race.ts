// Kugel-Rennen: reibungsfreies Gleiten entlang beliebiger Bahnen unter Schwerkraft.
// Bewegungsgleichung entlang der Bogenlänge s:  s'' = g · dy/ds   (y zeigt nach unten)
// integriert mit Runge-Kutta 4. Ordnung.

export const G = 9.81;
export const H = 1; // Fallhöhe [m]
export const R = H / 2; // Zykloiden-Radius
export const W = Math.PI * R; // Horizontale Distanz [m] (Zykloide endet waagrecht)

export type Curve = {x: Float64Array; y: Float64Array; s: Float64Array; len: number};

const build = (fn: (u: number) => [number, number], n = 6000): Curve => {
  const x = new Float64Array(n + 1);
  const y = new Float64Array(n + 1);
  const s = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const [a, b] = fn(i / n);
    x[i] = a;
    y[i] = b;
    if (i > 0) s[i] = s[i - 1] + Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]);
  }
  return {x, y, s, len: s[n]};
};

export const TRACKS = {
  // A: Gerade – kürzester Weg
  A: () => build((u) => [u * W, u * H]),
  // B: Kreisbogen durch Start und Ziel, waagrecht im Ziel
  B: () => {
    const rad = (W * W + H * H) / (2 * H);
    const cx = W;
    const cy = H - rad;
    const a0 = Math.atan2(0 - cy, 0 - cx);
    const a1 = Math.PI / 2;
    return build((u) => {
      const a = a0 + (a1 - a0) * u;
      return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
    });
  },
  // C: Zykloide (Brachistochrone)
  C: () => build((u) => {
    const th = Math.PI * u;
    return [R * (th - Math.sin(th)), R * (1 - Math.cos(th))];
  }),
  // D: senkrechter Absturz, abgerundeter Knick, dann flach
  D: () => {
    const rc = 0.12;
    const l1 = H - rc;
    const l2 = (Math.PI / 2) * rc;
    const l3 = W - rc;
    const tot = l1 + l2 + l3;
    return build((u) => {
      const d = u * tot;
      if (d < l1) return [0, d];
      if (d < l1 + l2) {
        const a = (d - l1) / rc; // 0..π/2
        return [rc - rc * Math.cos(a), l1 + rc * Math.sin(a)];
      }
      return [rc + (d - l1 - l2), H];
    }, 9000);
  },
};

const slopeAt = (c: Curve, s: number) => {
  // dy/ds des Segments, in dem s liegt (binäre Suche)
  let lo = 0;
  let hi = c.s.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c.s[m] <= s) lo = m;
    else hi = m;
  }
  const ds = c.s[hi] - c.s[lo] || 1e-12;
  return {k: (c.y[hi] - c.y[lo]) / ds, i: lo, f: (s - c.s[lo]) / ds};
};

export const pointAt = (c: Curve, s: number): [number, number] => {
  const sc = Math.max(0, Math.min(c.len, s));
  const {i, f} = slopeAt(c, sc);
  const j = Math.min(i + 1, c.x.length - 1);
  return [c.x[i] + (c.x[j] - c.x[i]) * f, c.y[i] + (c.y[j] - c.y[i]) * f];
};

/**
 * Simuliert eine Kugel ab Bogenlänge s0 (Ruhe). Liefert Positionen in festen
 * Zeitschritten `sample` und die exakte Ankunftszeit am Bahnende.
 */
export const run = (c: Curve, s0 = 0, sample = 0.001, tMax = 1.5) => {
  const dt = 1e-5;
  let s = s0;
  let v = 0;
  let t = 0;
  let finish = -1;
  const xs: number[] = [];
  const ys: number[] = [];
  const acc = (ss: number) => G * slopeAt(c, ss).k;
  let next = 0;
  while (t <= tMax + 1e-9) {
    if (t >= next - 1e-12) {
      const [px, py] = pointAt(c, s);
      xs.push(px);
      ys.push(py);
      next += sample;
    }
    if (finish < 0) {
      const k1s = v;
      const k1v = acc(s);
      const k2s = v + (dt / 2) * k1v;
      const k2v = acc(s + (dt / 2) * k1s);
      const k3s = v + (dt / 2) * k2v;
      const k3v = acc(s + (dt / 2) * k2s);
      const k4s = v + dt * k3v;
      const k4v = acc(s + dt * k3s);
      const sn = s + (dt / 6) * (k1s + 2 * k2s + 2 * k3s + k4s);
      const vn = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      if (sn >= c.len) {
        finish = t + (dt * (c.len - s)) / (sn - s);
        s = c.len;
      } else {
        s = sn;
        v = vn;
      }
    }
    t += dt;
  }
  return {xs, ys, finish};
};

/** Bogenlänge auf der Zykloide zum Parameter θ */
export const cycloidS = (th: number) => 4 * R * (1 - Math.cos(th / 2));
