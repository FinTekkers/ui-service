/**
 * US-365: times Holdings over time on the live broker, N runs each way, and
 * prints the medians. The guardrail: on a cold cache the holdings arrive
 * within ±10% of the load before US-365.
 * - before: the old load, the week's two searches and the history search
 *   together (fetchFreeSoma and fetchSomaHistory, uncached);
 * - cold: loadFreeSoma with empty caches, to streamed.history, and on to
 *   streamed.mix (its search starts once the holdings' has settled);
 * - side by side: the holdings and mix searches started together, which
 *   loadFreeSoma does not do (it slowed the holdings by about half);
 * - warm: loadFreeSoma again, a cache hit.
 * Prints timings only, never the key or a row.
 *
 * Run on the host with the page's key:
 *   set -a; . /etc/fintekkers/homepage-key.env; set +a
 *   BROKER_HOST=127.0.0.1:8085 npx vite-node --config vitest.config.js \
 *     scripts/time-soma-load.ts [runs=5]
 */
import { searchPositions } from "../src/lib/positions";
import {
  SOMA_HISTORY_FIELDS,
  SOMA_HISTORY_MEASURES,
  SOMA_MIX_FIELDS,
  SOMA_MIX_MEASURES,
  fetchFreeSoma,
  fetchSomaHistory,
  loadFreeSoma,
  resetSomaCaches,
  somaRequest,
} from "../src/lib/server/free-soma";
import { somaWeek } from "../src/lib/free/soma";

const key = process.env.FT_HOMEPAGE_API_KEY?.trim() as string;
const runs = Number(process.argv[2] ?? 5);
if (!key || !Number.isInteger(runs) || runs < 1) {
  console.error("usage: FT_HOMEPAGE_API_KEY=… time-soma-load.ts [runs]");
  process.exit(2);
}
const now = new Date();
const week = somaWeek(null, now.toISOString().slice(0, 10));

// The loads' own per-search logs would drown the summary.
const log = console.log;
console.log = () => undefined;

const since = (started: number) => performance.now() - started;

async function before(): Promise<number> {
  const started = performance.now();
  const [, history] = await Promise.all([
    fetchFreeSoma(key, null, now),
    fetchSomaHistory(key, week).then((h) => {
      if (!h.ok) throw new Error(h.message);
      return since(started);
    }),
  ]);
  return history;
}

async function load(): Promise<{ history: number; mix: number }> {
  const started = performance.now();
  const data = await loadFreeSoma(key, null, now);
  const h = await data.streamed.history;
  const history = since(started);
  const m = await data.streamed.mix;
  if (!h.ok || !m?.ok) throw new Error("unavailable");
  return { history, mix: since(started) };
}

async function sideBySide(): Promise<number> {
  const started = performance.now();
  const search = (fields: number[], measures: number[]) =>
    searchPositions(somaRequest(week, fields, measures).toProto(), key);
  const [history] = await Promise.all([
    search(SOMA_HISTORY_FIELDS, SOMA_HISTORY_MEASURES).then(() =>
      since(started)
    ),
    search(SOMA_MIX_FIELDS, SOMA_MIX_MEASURES),
  ]);
  return history;
}

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const t = { before: [], cold: [], coldMix: [], side: [], warm: [] } as Record<
  string,
  number[]
>;
// Interleaved, so drift on the shared host hits every way alike.
for (let i = 0; i < runs; i++) {
  t.before.push(await before());
  resetSomaCaches();
  const cold = await load();
  t.cold.push(cold.history);
  t.coldMix.push(cold.mix);
  t.warm.push((await load()).history);
  t.side.push(await sideBySide());
  log(
    `run ${i + 1}: before ${t.before[i].toFixed(0)} ms; cold ${t.cold[
      i
    ].toFixed(0)} ms (mix ${t.coldMix[i].toFixed(0)} ms); warm ${t.warm[
      i
    ].toFixed(0)} ms; side by side ${t.side[i].toFixed(0)} ms`
  );
}
const base = median(t.before);
const pct = (v: number) => `${(((v - base) / base) * 100).toFixed(1)}%`;
log(`week ${week}, ${runs} runs; medians, to Holdings over time:`);
log(`  before US-365       ${base.toFixed(0)} ms`);
log(
  `  cold cache          ${median(t.cold).toFixed(0)} ms (${pct(
    median(t.cold)
  )}); mix at ${median(t.coldMix).toFixed(0)} ms`
);
log(
  `  warm cache          ${median(t.warm).toFixed(0)} ms (${pct(
    median(t.warm)
  )})`
);
log(
  `  side by side (not shipped) ${median(t.side).toFixed(0)} ms (${pct(
    median(t.side)
  )})`
);
process.exit(0);
