/**
 * Test-only oracle for /free/tips. The calculator's compute() from the
 * owner's DataExplorerTIPS.dc.html artboard, version 1792630643-19db
 * (~/designs/fintekkers-homepage-2026-10-22/, lines 330–379), copied
 * verbatim apart from TypeScript types and taking the state as an argument.
 * src/tests/free-tips-mock.test.ts runs it on the artboard's defaults and
 * checks every literal in src/lib/free/mock/tips.ts against it. Shipped code
 * never imports this: the page shows the stored literals only.
 */

export interface OracleState {
  face: string;
  coupon: string;
  baseCpi: string;
  refCpi: string;
  years: string;
  realYield: string;
  inflation: string;
}

export interface OracleRow {
  t: string;
  ir: string;
  cpn: string;
  prin: string;
  tot: string;
}

export interface OracleOutput {
  ir: string;
  adj: string;
  cpn: string;
  realPrice: string;
  value: string;
  nominal: string;
  total: string;
  rows: OracleRow[];
}

export function compute(st: OracleState): OracleOutput {
  const num = (v: string, d: number) => {
    const x = parseFloat(String(v).replace(/,/g, ""));
    return isFinite(x) ? x : d;
  };
  const face = num(st.face, 10000);
  const c = num(st.coupon, 1.875) / 100;
  const base = Math.max(num(st.baseCpi, 324.93471), 0.0001);
  const ref = num(st.refCpi, 332.92643);
  const y = Math.max(num(st.realYield, 2.25) / 100, -0.99);
  const pi = Math.max(num(st.inflation, 2.3) / 100, -0.99);
  const n = Math.min(120, Math.max(1, Math.round(num(st.years, 9.5) * 2)));

  const money = (x: number) =>
    "$" +
    x.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const ir = Math.round((ref / base) * 100000) / 100000;
  const adj = face * ir;
  const cpn = (adj * c) / 2;

  let realPrice = 0;
  for (let k = 1; k <= n; k++)
    realPrice += (c * 100) / 2 / Math.pow(1 + y / 2, k);
  realPrice += 100 / Math.pow(1 + y / 2, n);
  const value = (face / 100) * realPrice * ir;

  const g = Math.sqrt(1 + pi);
  const rows: OracleRow[] = [];
  const flows: number[] = [];
  let total = 0;
  for (let k = 1; k <= n; k++) {
    const irk = ir * Math.pow(g, k);
    const coup = (face * irk * c) / 2;
    const prin = k === n ? face * Math.max(irk, 1) : 0;
    const tot = coup + prin;
    total += tot;
    flows.push(tot);
    rows.push({
      t: (k / 2).toFixed(1) + " yr",
      ir: irk.toFixed(5),
      cpn: money(coup),
      prin: prin ? money(prin) : "—",
      tot: money(tot),
    });
  }
  const pv = (i: number) => {
    let s = 0;
    for (let k = 0; k < flows.length; k++)
      s += flows[k] / Math.pow(1 + i / 2, k + 1);
    return s;
  };
  let lo = -0.5,
    hi = 1;
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > value) lo = mid;
    else hi = mid;
  }
  const nominal = (lo + hi) / 2;

  return {
    ir: ir.toFixed(5),
    adj: money(adj),
    cpn: money(cpn),
    realPrice: realPrice.toFixed(4),
    value: money(value),
    nominal: (nominal * 100).toFixed(3) + "%",
    total: money(total),
    rows,
  };
}
