declare const process: any;
// Sparplan-Rechnung: 100 € monatlich, 7 % p. a. (monatlich verzinst: (1,07)^(1/12) − 1), Einzahlung zu Monatsbeginn.
export const R = 0.07;
export const RM = Math.pow(1 + R, 1 / 12) - 1;
export const RATE = 100;
export const PEOPLE = [
  {id: 'anna', name: 'Anna', from: 20, to: 30},
  {id: 'ben', name: 'Ben', from: 30, to: 65},
];
/** Vermögen und Einzahlungen pro Monat vom 20. bis 65. Lebensjahr */
export const series = (p: (typeof PEOPLE)[number]) => {
  const out: {age: number; value: number; paid: number}[] = [];
  let v = 0;
  let paid = 0;
  for (let m = 0; m <= 45 * 12; m++) {
    const age = 20 + m / 12;
    out.push({age, value: v, paid});
    if (age >= p.from && age < p.to) {
      v += RATE;
      paid += RATE;
    }
    v *= 1 + RM;
  }
  return out;
};
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  for (const p of PEOPLE) {
    const s = series(p);
    const at = (a: number) => s[Math.round((a - 20) * 12)];
    console.log(p.name, 'eingezahlt', at(65).paid, '€ | mit 30:', Math.round(at(30).value), '| mit 45:', Math.round(at(45).value), '| mit 55:', Math.round(at(55).value), '| mit 65:', Math.round(at(65).value), '€');
  }
  const a = series(PEOPLE[0]);
  const b = series(PEOPLE[1]);
  const cross = b.findIndex((x, i) => x.value > a[i].value);
  console.log('Ben überholt Anna:', cross < 0 ? 'nie' : (20 + cross / 12).toFixed(1));
}
