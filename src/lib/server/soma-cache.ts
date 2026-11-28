/**
 * US-365: /free/soma's whole-history results, held in this server process
 * and keyed by the latest SOMA trade date the ledger holds, so they are
 * recomputed only when a newer week lands (the Friday SOMA load). Only
 * computed results are held, never the ledger's rows.
 *
 * One server key (FT_HOMEPAGE_API_KEY) serves every visitor, and the SOMA
 * portfolio is public, so an entry is not keyed by the key.
 *
 * - Concurrent requests share one in-flight computation (or check).
 * - An entry checked within SOMA_LATEST_PROBE_MS, for the same latest
 *   week, is served with no ledger call.
 * - After that, or when the calendar moves to a new week, one cheap probe
 *   asks the ledger for its latest SOMA trade date. A newer one recomputes;
 *   otherwise the entry is kept, and checked again later. A failed probe
 *   serves the entry.
 * - A failed computation (null, a throw or a timeout) is never stored, so
 *   the next request tries again.
 */

/** The longest a cached result goes without a check for a newer week. */
export const SOMA_LATEST_PROBE_MS = 5 * 60_000;

/** A computation's result, and the latest trade date it read. */
export interface Computed<T> {
  latestWeek: string;
  value: T;
}

export interface WeekCache<T> {
  /**
   * The cached value for trades up to `upTo` (the latest H.4.1 week), or a
   * new one from `compute`. `probe` gives the ledger's latest SOMA trade
   * date on or before `upTo`. On a cold cache `compute` is called before
   * this returns, so callers' searches start in call order. Never rejects:
   * null when the value could not be computed.
   */
  get(
    upTo: string,
    compute: (upTo: string) => Promise<Computed<T> | null>,
    probe: () => Promise<string | null>
  ): Promise<T | null>;
  /** Empties the cache: for tests. */
  reset(): void;
}

interface Entry<T> extends Computed<T> {
  upTo: string;
  checkedAt: number;
}

export function createWeekCache<T>(name: string): WeekCache<T> {
  let entry: Entry<T> | null = null;
  let inflight: Promise<T | null> | null = null;

  async function recompute(
    upTo: string,
    compute: (upTo: string) => Promise<Computed<T> | null>
  ): Promise<T | null> {
    try {
      const result = await compute(upTo);
      if (!result) return null;
      entry = { ...result, upTo, checkedAt: Date.now() };
      console.log(`${name} cached for ${result.latestWeek}`);
      return result.value;
    } catch (error) {
      console.log(`${name} not computed`, (error as Error)?.message);
      return null;
    }
  }

  async function revalidate(
    held: Entry<T>,
    upTo: string,
    compute: (upTo: string) => Promise<Computed<T> | null>,
    probe: () => Promise<string | null>
  ): Promise<T | null> {
    let latest: string | null;
    try {
      latest = await probe();
    } catch (error) {
      console.log(
        `${name}: could not check for a newer week; serving ${held.latestWeek}`,
        (error as Error)?.message
      );
      held.checkedAt = Date.now();
      return held.value;
    }
    if (latest === null || latest <= held.latestWeek) {
      held.upTo = upTo;
      held.checkedAt = Date.now();
      return held.value;
    }
    console.log(`${name}: ${latest} is newer than ${held.latestWeek}`);
    // The old entry stays until the new one is computed: a failure here
    // leaves it stale, so the next request checks, and recomputes, again.
    return recompute(upTo, compute);
  }

  return {
    get(upTo, compute, probe) {
      if (inflight) return inflight;
      if (
        entry &&
        entry.upTo === upTo &&
        Date.now() - entry.checkedAt < SOMA_LATEST_PROBE_MS
      ) {
        return Promise.resolve(entry.value);
      }
      const run = entry
        ? revalidate(entry, upTo, compute, probe)
        : recompute(upTo, compute);
      const shared = run.finally(() => {
        if (inflight === shared) inflight = null;
      });
      inflight = shared;
      return shared;
    },
    reset() {
      entry = null;
      inflight = null;
    },
  };
}
