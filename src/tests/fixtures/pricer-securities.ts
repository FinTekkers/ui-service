/**
 * US-303: security protos as the CUSIP lookup returns them, one per product
 * type the pricers meet, for the arm-from-security tests. Only product_type
 * (and bond_details.coupon_type) decide the arm in ledger-models' builder.
 */
import {
  BondDetailsProto,
  FrnExtensionProto,
  IndexDetailsProto,
  SecurityProto,
  TipsExtensionProto,
} from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { CouponTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js";
import { CouponFrequencyProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import index_type_pkg from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { toDecimalProto } from "$lib/decimal";

const { IndexTypeProto } = index_type_pkg;

export const SECURITY_UUID = "0a10c0ff-ee00-4000-8000-000000000303";

function localDate(iso: string): LocalDateProto {
  const [y, m, d] = iso.split("-").map(Number);
  return new LocalDateProto().setYear(y).setMonth(m).setDay(d);
}

function bondDetails(couponType: number, couponRate: string) {
  return new BondDetailsProto()
    .setCouponType(couponType)
    .setCouponRate(toDecimalProto(couponRate))
    .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
    .setFaceValue(toDecimalProto("1000"))
    .setIssueDate(localDate("2026-01-15"))
    .setDatedDate(localDate("2026-01-15"))
    .setMaturityDate(localDate("2030-01-15"));
}

function base(productType: number): SecurityProto {
  return new SecurityProto()
    .setUuid(new UUID(UUID.fromString(SECURITY_UUID)).toUUIDProto())
    .setProductType(productType)
    .setIssuerName("US Government");
}

export type ReturnedType = "TBILL" | "STRIPS" | "MBS" | "FRN" | "TIPS";

/** The security the CUSIP lookup returns for each product type. */
export function lookedUp(type: ReturnedType | "CPI_SERIES"): SecurityProto {
  switch (type) {
    case "TBILL":
      return base(ProductTypeProto.TBILL).setBondDetails(
        bondDetails(CouponTypeProto.ZERO, "0")
      );
    case "STRIPS":
      return base(ProductTypeProto.STRIPS).setBondDetails(
        bondDetails(CouponTypeProto.ZERO, "0")
      );
    case "MBS":
      return base(ProductTypeProto.MORTGAGE_BACKED).setBondDetails(
        bondDetails(CouponTypeProto.FIXED, "5.5")
      );
    case "FRN":
      return base(ProductTypeProto.TREASURY_FRN)
        .setBondDetails(bondDetails(CouponTypeProto.FLOAT, "4.2"))
        .setFrnExtension(
          new FrnExtensionProto()
            .setSpread(toDecimalProto("20"))
            .setReferenceRateIndex(IndexTypeProto.T_BILL_13_WEEK)
        );
    case "TIPS":
      return base(ProductTypeProto.TIPS)
        .setBondDetails(bondDetails(CouponTypeProto.FIXED, "2.125"))
        .setTipsExtension(
          new TipsExtensionProto()
            .setBaseCpi(toDecimalProto("319.12345"))
            .setInflationIndexType(IndexTypeProto.CPI_U)
        );
    case "CPI_SERIES":
      return base(ProductTypeProto.CPI_SERIES).setIndexDetails(
        new IndexDetailsProto().setIndexType(IndexTypeProto.CPI_U)
      );
  }
}

/** The arm ledger-models' builder must pick for each returned type. */
export const EXPECTED_ARM: Record<
  ReturnedType,
  "bond" | "mbs" | "frn" | "tips"
> = {
  TBILL: "bond",
  STRIPS: "bond",
  MBS: "mbs",
  FRN: "frn",
  TIPS: "tips",
};

export const CPI_READINGS = [
  { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "327.111" },
  { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "328.222" },
];

/** The ProductInput arm set on a captured ValuationRequestProto. */
export function armOf(request: any): string | undefined {
  const input = request.getProductInput();
  if (input.getBond()) return "bond";
  if (input.getMbs()) return "mbs";
  if (input.getFrn()) return "frn";
  if (input.getTips()) return "tips";
  return undefined;
}
