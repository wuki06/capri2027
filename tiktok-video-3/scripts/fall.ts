// Freier Fall durch einen Tunnel durch den Erdmittelpunkt (Vakuum, keine Reibung).
// Schwerkraft im Erdinneren nach PREM (Preliminary Reference Earth Model, Dziewonski & Anderson 1981).
// Integration: Runge-Kutta 4, Δt = 0,05 s.

export const R_EARTH = 6371e3;
// Radius [km] -> g [m/s²] (PREM-Stützstellen)
const PREM: [number, number][] = [
  [0, 0],
  [600, 2.2],
  [1221.5, 4.4],
  [1800, 6.0],
  [2400, 7.6],
  [3000, 9.2],
  [3480, 10.68],
  [4000, 10.3],
  [4500, 10.1],
  [5000, 10.0],
  [5701, 10.0],
  [6000, 9.93],
  [6371, 9.82],
];

export const gAt = (rMeters: number) => {
  const r = Math.abs(rMeters) / 1000;
  for (let i = 1; i < PREM.length; i++) {
    if (r <= PREM[i][0]) {
      const [r0, g0] = PREM[i - 1];
      const [r1, g1] = PREM[i];
      return g0 + ((r - r0) / (r1 - r0)) * (g1 - g0);
    }
  }
  return 9.82 * (6371 / r) ** 2;
};

/** Position x (m, Start bei +R) und Geschwindigkeit über die Zeit, abgetastet jede `sample` Sekunden */
export const simulateFall = (sample = 1, tMax = 4800) => {
  const dt = 0.05;
  let x = R_EARTH;
  let v = 0;
  const acc = (p: number) => -Math.sign(p) * gAt(p);
  const xs: number[] = [];
  const vs: number[] = [];
  let tCenter = -1;
  let tArrive = -1;
  let vMax = 0;
  let next = 0;
  for (let t = 0; t <= tMax; t += dt) {
    if (t >= next - 1e-9) {
      xs.push(x);
      vs.push(v);
      next += sample;
    }
    const k1x = v, k1v = acc(x);
    const k2x = v + (dt / 2) * k1v, k2v = acc(x + (dt / 2) * k1x);
    const k3x = v + (dt / 2) * k2v, k3v = acc(x + (dt / 2) * k2x);
    const k4x = v + dt * k3v, k4v = acc(x + dt * k3x);
    const nx = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    const nv = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    if (tCenter < 0 && x > 0 && nx <= 0) tCenter = t + (dt * x) / (x - nx);
    if (tArrive < 0 && v < 0 && nv >= 0) tArrive = t + dt * (-v / (nv - v));
    x = nx;
    v = nv;
    vMax = Math.max(vMax, Math.abs(v));
  }
  return {xs, vs, tCenter, tArrive, vMax, xMin: Math.min(...xs)};
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = simulateFall();
  console.log('Mittelpunkt nach', (r.tCenter / 60).toFixed(2), 'min');
  console.log('Ankunft nach', (r.tArrive / 60).toFixed(2), 'min, tiefster Punkt', (r.xMin / 1000).toFixed(1), 'km');
  console.log('vMax', (r.vMax / 1000).toFixed(2), 'km/s =', Math.round(r.vMax * 3.6), 'km/h');
  console.log('Homogene Erde zum Vergleich:', ((Math.PI * Math.sqrt(R_EARTH / 9.82)) / 60).toFixed(2), 'min');
  // Zeitpunkte beim Durchqueren der Schichtgrenzen
  for (const depth of [35, 2891, 5150]) {
    const i = r.xs.findIndex((x) => x <= R_EARTH - depth * 1000);
    console.log('Tiefe', depth, 'km nach', (i / 60).toFixed(2), 'min, v =', Math.round(Math.abs(r.vs[i]) * 3.6), 'km/h');
  }
}
