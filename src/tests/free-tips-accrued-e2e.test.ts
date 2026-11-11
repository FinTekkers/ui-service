/**
 * US-311: valuation-service's TIPS ACCRUED_INTEREST through the broker, on
 * /free/tips's own request path (loadAccruedInterest), with nothing mocked.
 *
 * 91282CPU9 (1⅞%, Jan/Jul 15) settling 2026-11-06, a position of its $1,000
 * face, priced at FedInvest's 2026-11-06 record with the August and
 * September 2026 CPI-U readings: accrued interest is index-scaled (31 CFR
 * 356), 1,000 × 1.875% / 2 × 114/184 × 1.03192 = 5.99 to the cent. The
 * unscaled figure would be 5.81. Needs the index-scaling fix (VS-157)
 * deployed on the host valuation-service.
 *
 * Run against the host broker, e.g.
 *   BROKER_HOST=127.0.0.1:8085 FT_E2E_API_KEY=… npx vitest run \
 *     --config vitest.integration.config.js src/tests/free-tips-accrued-e2e.test.ts
 * Skips without FT_E2E_API_KEY; a skip is not a pass.
 */
import { describe, expect, test } from "vitest";
import Decimal from "decimal.js";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { fetchCpiReadings, type CpiReading } from "$lib/cpi";
import type { TipsSecurityView } from "$lib/free/tips";
import { FetchSecurityProtoByCusip } from "$lib/security";
import {
  FREE_TIPS_CUSIP,
  fetchLatestRealCleanPrice,
  loadAccruedInterest,
  securityView,
} from "$lib/server/free-tips";

const API_KEY = process.env.FT_E2E_API_KEY;
const SETTLEMENT = "2026-11-06";

describe.skipIf(!API_KEY)(
  "US-311: TIPS ACCRUED_INTEREST via the broker",
  () => {
    test("91282CPU9 on 2026-11-06 accrues $5.99 per $1,000", async () => {
      const apiKey = API_KEY as string;
      const proto = await FetchSecurityProtoByCusip(FREE_TIPS_CUSIP, apiKey);
      const security = securityView(proto);
      expect(security?.faceValue).toBe("1000");

      const uuid = UUID.fromUUIDProto(proto.getUuid())?.toString();
      expect(uuid).toBeTruthy();
      const price = await fetchLatestRealCleanPrice(
        uuid as string,
        apiKey,
        new Date(`${SETTLEMENT}T23:59:59Z`)
      );
      expect(price?.date).toBe(SETTLEMENT);

      const { readings } = await fetchCpiReadings(SETTLEMENT, apiKey);
      expect(readings?.map((r) => [r.year, r.month])).toEqual([
        [2026, 8],
        [2026, 9],
      ]);

      const accrued = await loadAccruedInterest(
        proto,
        security as TipsSecurityView,
        price as { value: string; date: string },
        readings as CpiReading[],
        apiKey
      );
      expect(accrued).not.toBeNull();
      expect(new Decimal(accrued as string).toDecimalPlaces(2).toFixed(2)).toBe(
        "5.99"
      );
    }, 60_000);
  }
);
