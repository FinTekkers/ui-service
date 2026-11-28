/**
 * US-354: the seed for the one security /free/corporate-bond/crwv-2030
 * values, the CoreWeave 9.25% 2030 notes, ISIN USU2069EAA83. Idempotent: it
 * creates the security when the ledger has none with that ISIN, updates it
 * (keeping its UUID) when its fields differ, does nothing when they match,
 * and aborts, writing nothing, when the ISIN matches more than one security.
 * It matches on the ISIN identifier only and writes nothing else.
 *
 * The call schedule and the change-of-control put are never written:
 * valuation is to maturity only (callable stays false, no call date).
 *
 * Credentials come from the environment only: FT_SEED_API_KEY (a key with
 * ledger write permission) and BROKER_HOST. The key is never printed.
 * The entry point is scripts/seed-crwv-2030.ts.
 */
import Decimal from "decimal.js";
import {
  BondDetailsProto,
  SecurityProto,
} from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { CouponTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js";
import { CouponFrequencyProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js";
import { DayCountConventionProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/day_count_convention_pb.js";
import { IdentifierProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import type { DecimalValueProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import { fromDecimalProto, toDecimalProto } from "../../src/lib/decimal";
import { CRWV_ISIN } from "../../src/lib/free/corporateBond";

export { CRWV_ISIN };

function localDate(year: number, month: number, day: number): LocalDateProto {
  return new LocalDateProto().setYear(year).setMonth(month).setDay(day);
}

/**
 * The CRWV security as the seed writes it; a new UUID unless given one. `usd`
 * is the ledger's USD cash security, its settlement currency (the ledger
 * rejects a bond without one).
 */
export function crwvSecurityProto(
  uuid?: UUID,
  usd?: SecurityProto
): SecurityProto {
  const bond = new BondDetailsProto()
    .setCouponRate(toDecimalProto("9.25"))
    .setCouponType(CouponTypeProto.FIXED)
    .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
    .setIssueDate(localDate(2025, 5, 27))
    .setDatedDate(localDate(2025, 5, 27))
    .setMaturityDate(localDate(2030, 6, 1))
    .setFaceValue(toDecimalProto("1000"))
    .setDayCount(DayCountConventionProto.THIRTY_360_US);
  const security = new SecurityProto()
    .setProductType(ProductTypeProto.CORP_BOND)
    .setAssetClass("CREDIT")
    .setIssuerName("CoreWeave, Inc.")
    .setDescription("CoreWeave 9.25% Senior Notes due 2030")
    .setIdentifiersList([
      new IdentifierProto()
        .setIdentifierType(IdentifierTypeProto.ISIN)
        .setIdentifierValue(CRWV_ISIN),
    ])
    .setBondDetails(bond);
  if (usd) security.setSettlementCurrency(usd);
  stampOwn(security);
  security.setUuid((uuid ?? UUID.random()).toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  return security;
}

/** True when the security carries the CRWV ISIN. */
export function hasCrwvIsin(security: SecurityProto): boolean {
  return security
    .getIdentifiersList()
    .some(
      (id) =>
        id.getIdentifierType() === IdentifierTypeProto.ISIN &&
        id.getIdentifierValue().trim() === CRWV_ISIN
    );
}

function dateText(d: LocalDateProto | undefined): string {
  return d && d.getYear() ? `${d.getYear()}-${d.getMonth()}-${d.getDay()}` : "";
}

function decimalText(d: DecimalValueProto | undefined): string {
  const text = fromDecimalProto(d);
  return text ? new Decimal(text).toString() : "";
}

/** The fields the seed sets, comparable across a ledger round trip. */
function fingerprint(security: SecurityProto): string {
  const bond = security.getBondDetails();
  return JSON.stringify({
    productType: security.getProductType(),
    assetClass: security.getAssetClass(),
    issuer: security.getIssuerName(),
    description: security.getDescription(),
    settlement:
      security.getSettlementCurrency()?.getCashDetails()?.getCashId() ?? "",
    identifiers: security
      .getIdentifiersList()
      .map((id) => `${id.getIdentifierType()}:${id.getIdentifierValue()}`)
      .sort(),
    coupon: decimalText(bond?.getCouponRate()),
    couponType: bond?.getCouponType(),
    frequency: bond?.getCouponFrequency(),
    issue: dateText(bond?.getIssueDate()),
    dated: dateText(bond?.getDatedDate()),
    maturity: dateText(bond?.getMaturityDate()),
    face: decimalText(bond?.getFaceValue()),
    dayCount: bond?.getDayCount() ?? null,
    callable: bond?.getCallable() ?? false,
    callDate: dateText(bond?.getCallDate()),
  });
}

export type SeedAction = "create" | "update" | "noop" | "abort";

/** What to do, given the ledger's securities carrying the CRWV ISIN. */
export function seedAction(
  existing: SecurityProto[],
  wanted: SecurityProto
): SeedAction {
  const matches = existing.filter(hasCrwvIsin);
  if (matches.length > 1) return "abort";
  if (matches.length === 0) return "create";
  return fingerprint(matches[0]) === fingerprint(wanted) ? "noop" : "update";
}

export interface SeedDeps {
  /** Every ledger security with this ISIN identifier. */
  search: (isin: string) => Promise<SecurityProto[]>;
  /** The ledger's USD cash security (read only). */
  usd: () => Promise<SecurityProto>;
  /** Security/CreateOrUpdate. */
  write: (security: SecurityProto) => Promise<void>;
  log: (line: string) => void;
  error: (line: string) => void;
}

export const REQUIRED_ENV = ["FT_SEED_API_KEY", "BROKER_HOST"] as const;

/**
 * One seed run. Returns the exit code: 0 done (create, update or noop),
 * 1 aborted or failed, 2 a required variable is missing. `makeDeps` is
 * called with the key only after the variables are checked.
 */
export async function main(
  env: Record<string, string | undefined>,
  makeDeps: (apiKey: string) => SeedDeps | Promise<SeedDeps>,
  report: Pick<SeedDeps, "log" | "error"> = console
): Promise<number> {
  const missing = REQUIRED_ENV.filter((name) => !env[name]?.trim());
  if (missing.length) {
    report.error(
      `seed-crwv-2030: set ${missing.join(" and ")} in the environment`
    );
    return 2;
  }
  const deps = await makeDeps((env.FT_SEED_API_KEY as string).trim());
  try {
    const existing = (await deps.search(CRWV_ISIN)).filter(hasCrwvIsin);
    const usd = await deps.usd();
    const wanted = crwvSecurityProto(undefined, usd);
    const action = seedAction(existing, wanted);
    if (action === "abort") {
      deps.error(
        `seed-crwv-2030: abort, ${existing.length} securities have ISIN ${CRWV_ISIN}; nothing written`
      );
      return 1;
    }
    if (action === "update") {
      const uuid = UUID.fromUUIDProto(existing[0].getUuid());
      if (!uuid) throw new Error("the existing security has no UUID");
      await deps.write(crwvSecurityProto(uuid, usd));
    } else if (action === "create") {
      await deps.write(wanted);
    }
    deps.log(`seed-crwv-2030: ${action} ${CRWV_ISIN}`);
    return 0;
  } catch (error) {
    // The message only: the error object can carry request metadata.
    deps.error(`seed-crwv-2030: failed: ${(error as Error)?.message}`);
    return 1;
  }
}
