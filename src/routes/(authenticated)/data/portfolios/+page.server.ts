//Requests & Services
import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Portfolio from "@fintekkers/ledger-models/node/wrappers/models/portfolio/portfolio";
import { deleteEntity } from "$lib/entity-delete";
import { FetchTransactionByPortfolio } from "$lib/transactions";
import { primePortfolioUniverseCache } from "$lib/portfolios";
import { fail } from "@sveltejs/kit";
import {
  fetchElections,
  saveElections,
  type PortfolioElections,
} from "$lib/portfolioElections";
import {
  ELECTION_KEYS,
  isValidElection,
  type ElectionValues,
} from "$lib/electionValues";

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, url }) {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService(locals.user?.apiKey);

  // Empty filter = all portfolios. The SOMA-only PORTFOLIO_NAME
  // filter that lived here previously was a single-portfolio-seed
  // expedient that became second-brain#221 once the seed grew —
  // truncated the page to exactly the one portfolio name it
  // hardcoded. Page is the portfolios index; it should list every
  // portfolio the API returns.
  const filter: PositionFilter = new PositionFilter();

  const portfolioData = await portfolioService
    .searchPortfolio(now.toProto(), filter)
    .then((portfolios: Portfolio[]) => {
      console.log("Portfolios found: " + portfolios.length);
      // Per-row try/catch — a single malformed portfolio (e.g. a
      // missing/invalid asOf timestamp on legacy or partial data)
      // shouldn't tank the whole list. Same defensive pattern as
      // security.ts:elementsToReturn. Pre-#221 the hardcoded
      // PORTFOLIO_NAME filter incidentally hid these crashes by
      // narrowing to one well-formed row.
      const safe = <T>(fn: () => T, fallback: T): T => {
        try {
          return fn();
        } catch {
          return fallback;
        }
      };
      const rows: Array<{
        portfolioName: string;
        portfolioAsOf: string;
        portfolioId: string;
        uuidHex: string;
      }> = [];
      for (const portfolio of portfolios) {
        try {
          const uuidProto = portfolio.proto?.getUuid?.();
          const uuidHex = uuidProto
            ? Buffer.from(uuidProto.serializeBinary()).toString("hex")
            : "";
          rows.push({
            portfolioName: safe(() => portfolio.getPortfolioName(), ""),
            portfolioAsOf: safe(() => portfolio.getAsOf().toString(), ""),
            portfolioId: safe(() => portfolio.getID().toString(), ""),
            uuidHex,
          });
        } catch (rowErr: any) {
          console.warn(
            "Skipping portfolio row due to wrapper error:",
            rowErr?.message ?? rowErr
          );
        }
      }
      return rows;
    })
    .catch((err: Error) => {
      console.error("Portfolio fetch error:", err.message);
      return [
        {
          portfolioName: "Error: " + err.message,
          portfolioAsOf: "",
          portfolioId: "",
          uuidHex: "",
        },
      ];
    });

  // US-211: the index already searched every portfolio above — prime the
  // shared universe cache the transactions/positions filters read, so a
  // probe created mid-run is visible there immediately (no 5-minute wait).
  // A failed search returns a single "Error: …" row: keep the cached list
  // rather than replace it with an empty one.
  const searchFailed =
    Array.isArray(portfolioData) &&
    portfolioData.some((row) => row.portfolioName?.startsWith("Error: "));
  try {
    if (searchFailed) throw new Error("portfolio search failed");
    const universe = (Array.isArray(portfolioData) ? portfolioData : [])
      .filter(
        (row) =>
          typeof row.portfolioId === "string" &&
          row.portfolioId !== "" &&
          typeof row.portfolioName === "string" &&
          row.portfolioName !== "" &&
          !row.portfolioName.startsWith("Error: ")
      )
      .map((row) => ({
        portfolioId: row.portfolioId,
        portfolioName: row.portfolioName,
      }));
    primePortfolioUniverseCache(locals.user?.apiKey, universe);
  } catch {
    // Priming is best-effort; the page result below is authoritative.
  }

  // `url`, not `request.url`: SvelteKit tracks `url.searchParams`, so the
  // grid's Elections link (same route, new ?portfolioId=) re-runs this load.
  const selectedPortfolioId = url.searchParams.get("portfolioId");

  let transactions: import("$lib/transactions").TransactionData[] = [];
  if (selectedPortfolioId) {
    try {
      transactions = await FetchTransactionByPortfolio(
        selectedPortfolioId,
        locals.user?.apiKey
      );
    } catch (err: any) {
      console.error("Transaction fetch error:", err?.message ?? err);
    }
  }

  // US-242: the same ?portfolioId= also opens the elections panel. A failed
  // elections read leaves the transactions above untouched.
  let elections: PortfolioElections | null = null;
  let electionsError: string | null = null;
  if (selectedPortfolioId) {
    try {
      elections = await fetchElections(
        selectedPortfolioId,
        locals.user?.apiKey
      );
      if (!elections) electionsError = "Portfolio not found.";
    } catch (err: any) {
      console.error("Elections fetch error:", err?.message ?? err);
      electionsError = `Could not load elections: ${
        err?.details || err?.message || err
      }`;
    }
  }

  return {
    portfolioData,
    transactions,
    selectedPortfolioId,
    elections,
    electionsError,
    user: locals.user,
  };
}

export const actions = {
  // US-242: posts only after the user confirms. The form carries the as_of
  // the panel loaded and only the changed elections.
  saveElections: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { elections: { ok: false, error: "Sign in to save." } });
    }
    const formData = await request.formData();
    const portfolioId = String(formData.get("portfolioId") ?? "").trim();
    const baseAsOf = String(formData.get("baseAsOf") ?? "");
    const wanted: Partial<ElectionValues> = {};
    for (const key of ELECTION_KEYS) {
      const raw = formData.get(key);
      if (raw === null) continue;
      const value = Number(raw);
      if (
        raw === "" ||
        !Number.isInteger(value) ||
        !isValidElection(key, value)
      ) {
        return fail(400, {
          elections: { ok: false, error: `Unknown value for ${key}: ${raw}` },
        });
      }
      wanted[key] = value;
    }
    if (!portfolioId) {
      return fail(400, {
        elections: { ok: false, error: "Missing portfolio." },
      });
    }
    if (Object.keys(wanted).length === 0) {
      return fail(400, {
        elections: { ok: false, error: "No changes to save." },
      });
    }

    const result = await saveElections(
      portfolioId,
      wanted,
      baseAsOf,
      locals.user.apiKey
    );
    if (result.ok) {
      return {
        elections: { ok: true, asOf: result.asOf, changes: result.changes },
      };
    }
    const status = { invalid: 400, not_found: 404, stale: 409, broker: 502 }[
      result.reason
    ];
    return fail(status, { elections: { ok: false, error: result.error } });
  },
  dryRun: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get("uuidHex") as string;
    if (!uuidHex)
      return {
        deleteResult: {
          success: false,
          totalCount: 0,
          affectedEntities: [],
          warnings: [],
          error: "Missing UUID",
        },
      };
    return {
      deleteResult: await deleteEntity(
        "PORTFOLIO",
        uuidHex,
        true,
        false,
        false,
        locals.user?.apiKey
      ),
      uuidHex,
    };
  },
  confirmDelete: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get("uuidHex") as string;
    const cascade = formData.get("cascade") === "true";
    const force = formData.get("force") === "true";
    if (!uuidHex)
      return {
        deleteResult: {
          success: false,
          totalCount: 0,
          affectedEntities: [],
          warnings: [],
          error: "Missing UUID",
        },
      };
    return {
      deleteResult: await deleteEntity(
        "PORTFOLIO",
        uuidHex,
        false,
        force,
        cascade,
        locals.user?.apiKey
      ),
    };
  },
};
