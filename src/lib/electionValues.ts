/**
 * US-242: browser-safe election values and diffing, shared by the elections
 * panel and the save action. Valid values come from the generated enums in
 * ledger-models `amortisation_elections_pb`, not from display text.
 */
import pkg from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/amortisation_elections_pb.js";

const {
  PremiumAmortisationElectionProto,
  MarketDiscountInclusionProto,
  MarketDiscountAccrualMethodProto,
} = pkg;

export type ElectionKey =
  | "bondPremium"
  | "marketDiscountInclusion"
  | "marketDiscountAccrual";

export type ElectionValues = Record<ElectionKey, number>;

export interface ElectionChange {
  key: ElectionKey;
  from: number;
  to: number;
}

export const ELECTION_KEYS: ElectionKey[] = [
  "bondPremium",
  "marketDiscountInclusion",
  "marketDiscountAccrual",
];

const numbers = (e: object): number[] =>
  Object.values(e).filter((v): v is number => typeof v === "number");

const VALID_VALUES: Record<ElectionKey, number[]> = {
  bondPremium: numbers(PremiumAmortisationElectionProto),
  marketDiscountInclusion: numbers(MarketDiscountInclusionProto),
  marketDiscountAccrual: numbers(MarketDiscountAccrualMethodProto),
};

export function isValidElection(key: ElectionKey, value: number): boolean {
  return VALID_VALUES[key].includes(value);
}

/** The keys whose value differs, in field order, with old and new values. */
export function diffElections(
  before: ElectionValues,
  after: Partial<ElectionValues>
): ElectionChange[] {
  const changes: ElectionChange[] = [];
  for (const key of ELECTION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(after, key)) continue;
    const to = after[key];
    if (to === undefined || to === before[key]) continue;
    changes.push({ key, from: before[key], to });
  }
  return changes;
}
