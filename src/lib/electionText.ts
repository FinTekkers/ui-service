/**
 * US-242: display text for a portfolio's AmortisationElectionsProto.
 *
 * Meanings and defaults follow the comments in ledger-models
 * `fintekkers/models/portfolio/amortisation_elections.proto` and
 * `docs/adr/amortisation_elections.md`; nothing here redefines them and
 * the UI does no amortisation maths. The elections are fixed per portfolio
 * and apply to every lot (no effective date). Value 0 (UNSPECIFIED) means
 * "use the default", so it is shown as "Default (…)", never as the default's
 * concrete value.
 */
import pkg from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/amortisation_elections_pb.js";
import type { ElectionKey } from "$lib/electionValues";

const {
  PremiumAmortisationElectionProto,
  MarketDiscountInclusionProto,
  MarketDiscountAccrualMethodProto,
} = pkg;

export interface ElectionField {
  key: ElectionKey;
  label: string;
  irc: string;
  explanation: string;
  /** The concrete value UNSPECIFIED (0) stands for, per the proto comment. */
  defaultValue: number;
  /** Concrete (non-zero) values and their labels. */
  options: { value: number; label: string }[];
}

export const ELECTION_FIELDS: ElectionField[] = [
  {
    // bond_premium = 10; // IRC §171; UNSPECIFIED → PREMIUM_ELECTED
    key: "bondPremium",
    label: "Bond premium",
    irc: "§171",
    explanation:
      "Whether premium paid over face value is amortised over the bond's life, reducing its cost basis.",
    defaultValue: PremiumAmortisationElectionProto.PREMIUM_ELECTED,
    options: [
      {
        value: PremiumAmortisationElectionProto.PREMIUM_ELECTED,
        label: "Premium elected",
      },
      {
        value: PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED,
        label: "Premium not elected",
      },
    ],
  },
  {
    // market_discount_inclusion = 11; // IRC §1278(b); UNSPECIFIED → AT_DISPOSITION
    key: "marketDiscountInclusion",
    label: "Market discount inclusion",
    irc: "§1278(b)",
    explanation:
      "Whether market discount is included in income as it accrues, or only when the bond is sold or matures.",
    defaultValue: MarketDiscountInclusionProto.AT_DISPOSITION,
    options: [
      {
        value: MarketDiscountInclusionProto.AT_DISPOSITION,
        label: "At disposition",
      },
      {
        value: MarketDiscountInclusionProto.INCLUDE_CURRENTLY,
        label: "Include currently",
      },
    ],
  },
  {
    // market_discount_accrual = 12; // IRC §1276(b)(2); UNSPECIFIED → RATABLE; only with INCLUDE_CURRENTLY
    key: "marketDiscountAccrual",
    label: "Market discount accrual",
    irc: "§1276(b)(2)",
    explanation:
      "How market discount accrues: ratably or at a constant yield. Applies only with Include currently.",
    defaultValue: MarketDiscountAccrualMethodProto.RATABLE,
    options: [
      {
        value: MarketDiscountAccrualMethodProto.RATABLE,
        label: "Ratable",
      },
      {
        value: MarketDiscountAccrualMethodProto.CONSTANT_YIELD,
        label: "Constant yield",
      },
    ],
  },
];

function fieldFor(key: ElectionKey): ElectionField {
  const field = ELECTION_FIELDS.find((f) => f.key === key);
  if (!field) throw new Error(`Unknown election: ${key}`);
  return field;
}

/** "Default (Premium elected)" for 0, otherwise the concrete label. */
export function electionLabel(key: ElectionKey, value: number): string {
  const field = fieldFor(key);
  const label = (v: number) =>
    field.options.find((o) => o.value === v)?.label ?? `Unknown (${v})`;
  return value === 0 ? `Default (${label(field.defaultValue)})` : label(value);
}
