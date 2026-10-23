/**
 * US-242: read and save a portfolio's AmortisationElectionsProto through the
 * broker. `saveElections` is the only write path: it re-reads the stored
 * PortfolioProto, copies it whole and sets only the changed elections, then
 * sends it to broker CreateOrUpdate. Unchanged UNSPECIFIED (0) elections are
 * never written as concrete values.
 *
 * The ledger keeps only the latest version of a portfolio (no valid_from), so
 * there is no history here; it follows LS-147.
 */
import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { PositionFilterOperator } from "@fintekkers/ledger-models/node/wrappers/models/position/position_filter_operator";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import portfolio_pkg from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb.js";
import elections_pkg from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/amortisation_elections_pb.js";
import type { PortfolioProto as PortfolioProtoType } from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb";
import {
  diffElections,
  type ElectionChange,
  type ElectionValues,
} from "$lib/electionValues";

const { FieldProto } = field_pkg;
const { PortfolioProto } = portfolio_pkg;
const { AmortisationElectionsProto } = elections_pkg;

export interface PortfolioElections {
  /** The stored portfolio's as_of (ISO), i.e. when it was last saved. */
  asOf: string;
  elections: ElectionValues;
}

export type SaveResult =
  | { ok: true; asOf: string; changes: ElectionChange[] }
  | { ok: false; reason: "not_found" | "stale" | "invalid"; error: string }
  | { ok: false; reason: "broker"; error: string };

/** ISO time of a portfolio's as_of, or "" when it has none. */
export function asOfIso(proto: PortfolioProtoType): string {
  const ts = proto.getAsOf()?.getTimestamp();
  if (!ts) return "";
  return new Date(
    ts.getSeconds() * 1000 + Math.floor(ts.getNanos() / 1e6)
  ).toISOString();
}

/** Each election's stored value; 0 when the message or a field is unset. */
export function readElections(proto: PortfolioProtoType): ElectionValues {
  const e = proto.getAmortisationElections();
  return {
    bondPremium: e?.getBondPremium() ?? 0,
    marketDiscountInclusion: e?.getMarketDiscountInclusion() ?? 0,
    marketDiscountAccrual: e?.getMarketDiscountAccrual() ?? 0,
  };
}

/** The stored PortfolioProto for `portfolioId`, or null when none matches. */
export async function fetchPortfolioProto(
  portfolioId: string,
  apiKey?: string
): Promise<PortfolioProtoType | null> {
  const filter = new PositionFilter();
  filter.addFilter(
    FieldProto.PORTFOLIO_ID,
    PositionFilterOperator.fromName("EQUALS"),
    new UUID(UUID.fromString(portfolioId.trim()))
  );
  const found = await new PortfolioService(apiKey).searchPortfolio(
    dt.ZonedDateTime.now().toProto(),
    filter
  );
  // Newest first, in case the search ever returns more than one version.
  const protos = found
    .map((p) => p.proto)
    .filter((p): p is PortfolioProtoType => !!p)
    .sort((a, b) => asOfIso(b).localeCompare(asOfIso(a)));
  return protos[0] ?? null;
}

export async function fetchElections(
  portfolioId: string,
  apiKey?: string
): Promise<PortfolioElections | null> {
  const proto = await fetchPortfolioProto(portfolioId, apiKey);
  if (!proto) return null;
  return { asOf: asOfIso(proto), elections: readElections(proto) };
}

const SETTERS: Record<
  ElectionChange["key"],
  (e: InstanceType<typeof AmortisationElectionsProto>, v: number) => void
> = {
  bondPremium: (e, v) => e.setBondPremium(v),
  marketDiscountInclusion: (e, v) => e.setMarketDiscountInclusion(v),
  marketDiscountAccrual: (e, v) => e.setMarketDiscountAccrual(v),
};

/**
 * Saves the elections in `wanted` that differ from the stored portfolio.
 * `baseAsOf` is the as_of the user's form was loaded with; a different
 * stored as_of means someone saved since, so nothing is sent. That check is
 * best-effort, not atomic: a save landing between the re-read and
 * CreateOrUpdate can still be overwritten.
 */
export async function saveElections(
  portfolioId: string,
  wanted: Partial<ElectionValues>,
  baseAsOf: string,
  apiKey?: string
): Promise<SaveResult> {
  let latest: PortfolioProtoType | null;
  try {
    latest = await fetchPortfolioProto(portfolioId, apiKey);
  } catch (e: any) {
    return {
      ok: false,
      reason: "broker",
      error: e?.details || e?.message || String(e),
    };
  }
  if (!latest) {
    return { ok: false, reason: "not_found", error: "Portfolio not found." };
  }
  if (asOfIso(latest) !== baseAsOf) {
    return {
      ok: false,
      reason: "stale",
      error: "Portfolio changed since you opened it; reload.",
    };
  }
  const changes = diffElections(readElections(latest), wanted);
  if (changes.length === 0) {
    return { ok: false, reason: "invalid", error: "No changes to save." };
  }

  // A whole copy keeps every other field as stored.
  const portfolio = PortfolioProto.deserializeBinary(latest.serializeBinary());
  const elections =
    portfolio.getAmortisationElections() ?? new AmortisationElectionsProto();
  for (const change of changes) SETTERS[change.key](elections, change.to);
  portfolio.setAmortisationElections(elections);
  portfolio.setAsOf(dt.ZonedDateTime.now().toProto());

  try {
    const response = await new PortfolioService(apiKey).createPortfolio(
      portfolio
    );
    const saved = response.getPortfolioResponseList()[0] ?? portfolio;
    return { ok: true, asOf: asOfIso(saved), changes };
  } catch (e: any) {
    return {
      ok: false,
      reason: "broker",
      error: e?.details || e?.message || String(e),
    };
  }
}
