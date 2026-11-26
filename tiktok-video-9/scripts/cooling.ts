declare const process: any;
// Abkühlung einer 330-ml-Dose: Newtonsches Abkühlungsgesetz (konzentrierte Wärmekapazität)
//   dT/dt = -U·A / (m·c) · (T − T_umgebung)
// U = Wärmedurchgangskoeffizient (außen + innen), typische Werte aus der Literatur.
export const M = 0.33; // kg Inhalt (Wasser-ähnlich)
export const C = 4180; // J/(kg·K)
export const A = 0.034; // m² Oberfläche einer 330-ml-Dose
export const T0 = 25;
export const TARGET = 6;
export const METHODS = [
  {id: 'fridge', name: 'Kühlschrank', env: 5, U: 8},     // ruhende Luft
  {id: 'freezer', name: 'Gefrierfach', env: -18, U: 10}, // Luft, leichte Umwälzung
  {id: 'ice', name: 'Eiswasser', env: 0, U: 90},         // Wasser, natürliche Konvektion
  {id: 'salt', name: 'Eis + Salz + Drehen', env: -10, U: 260}, // Salzlake, erzwungene Konvektion
];
export const tempAt = (m: (typeof METHODS)[number], t: number) => m.env + (T0 - m.env) * Math.exp((-m.U * A * t) / (M * C));
export const timeTo = (m: (typeof METHODS)[number], T = TARGET) => -Math.log((T - m.env) / (T0 - m.env)) * (M * C) / (m.U * A);
if (typeof process !== "undefined" && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  for (const m of METHODS) {
    const s = timeTo(m);
    console.log(m.name.padEnd(22), (s / 60).toFixed(1), 'min', `| nach 90 s: ${tempAt(m, 90).toFixed(1)} °C`);
  }
}
