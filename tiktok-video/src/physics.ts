// Doppelpendel – exakte Bewegungsgleichungen (Lagrange-Formalismus, Punktmassen)
// integriert mit klassischem Runge-Kutta 4. Ordnung.

export type PendulumParams = {
  g: number; // Erdbeschleunigung [m/s²]
  l1: number; // Länge Stab 1 [m]
  l2: number; // Länge Stab 2 [m]
  m1: number; // Masse 1 [kg]
  m2: number; // Masse 2 [kg]
};

export const DEFAULT_PARAMS: PendulumParams = {
  g: 9.81,
  l1: 0.5,
  l2: 0.5,
  m1: 1,
  m2: 1,
};

// Zustand: [theta1, theta2, omega1, omega2]
const deriv = (
  s: Float64Array,
  p: PendulumParams,
  out: Float64Array,
): void => {
  const t1 = s[0];
  const t2 = s[1];
  const w1 = s[2];
  const w2 = s[3];
  const { g, l1, l2, m1, m2 } = p;
  const d = t1 - t2;
  const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
  const a1 =
    (-g * (2 * m1 + m2) * Math.sin(t1) -
      m2 * g * Math.sin(t1 - 2 * t2) -
      2 * Math.sin(d) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(d))) /
    (l1 * den);
  const a2 =
    (2 *
      Math.sin(d) *
      (w1 * w1 * l1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(t1) +
        w2 * w2 * l2 * m2 * Math.cos(d))) /
    (l2 * den);
  out[0] = w1;
  out[1] = w2;
  out[2] = a1;
  out[3] = a2;
};

const k1 = new Float64Array(4);
const k2 = new Float64Array(4);
const k3 = new Float64Array(4);
const k4 = new Float64Array(4);
const tmp = new Float64Array(4);

export const rk4Step = (
  s: Float64Array,
  dt: number,
  p: PendulumParams,
): void => {
  deriv(s, p, k1);
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + (dt / 2) * k1[i];
  deriv(tmp, p, k2);
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + (dt / 2) * k2[i];
  deriv(tmp, p, k3);
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + dt * k3[i];
  deriv(tmp, p, k4);
  for (let i = 0; i < 4; i++)
    s[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
};

export const energy = (s: Float64Array, p: PendulumParams): number => {
  const [t1, t2, w1, w2] = s;
  const { g, l1, l2, m1, m2 } = p;
  const T =
    0.5 * (m1 + m2) * l1 * l1 * w1 * w1 +
    0.5 * m2 * l2 * l2 * w2 * w2 +
    m2 * l1 * l2 * w1 * w2 * Math.cos(t1 - t2);
  const V = -(m1 + m2) * g * l1 * Math.cos(t1) - m2 * g * l2 * Math.cos(t2);
  return T + V;
};

/**
 * Simuliert N Pendel über `frames` Videoframes.
 * Rückgabe: Float32Array [frame][pendel][theta1, theta2]
 */
export const simulate = (opts: {
  n: number;
  frames: number;
  fps: number;
  theta1: number;
  theta2: number;
  delta: number; // Abstand der Startwinkel (rad) zwischen benachbarten Pendeln
  substeps?: number;
  params?: PendulumParams;
  float64?: boolean;
}): Float32Array | Float64Array => {
  const { n, frames, fps, theta1, theta2, delta } = opts;
  const substeps = opts.substeps ?? 24;
  const p = opts.params ?? DEFAULT_PARAMS;
  const dt = 1 / fps / substeps;
  const out = opts.float64 ? new Float64Array(frames * n * 2) : new Float32Array(frames * n * 2);
  const states: Float64Array[] = [];
  for (let i = 0; i < n; i++) {
    const s = new Float64Array(4);
    s[0] = theta1;
    s[1] = theta2 + i * delta;
    states.push(s);
  }
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < n; i++) {
      const s = states[i];
      const o = (f * n + i) * 2;
      out[o] = s[0];
      out[o + 1] = s[1];
      for (let k = 0; k < substeps; k++) rk4Step(s, dt, p);
    }
  }
  return out;
};
