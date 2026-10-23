/**
 * US-250: the homepage's "Live from the price service" chart data.
 *
 * Every AAPL daily close the price service holds, oldest first. The
 * caller passes the server-held homepage key (FT_HOMEPAGE_API_KEY), never
 * the visitor's. Lives under src/lib/server/ so SvelteKit refuses any
 * client import of it. Errors propagate; the homepage loader catches them.
 */
import { FetchSecurity } from "$lib/security";
import type { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { PriceService } from "@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";

const { FieldProto } = field_pkg;

export interface Close {
  date: string; // "YYYY-MM-DD" (UTC, as /data/prices shows it)
  close: number;
}

export const HOMEPAGE_TICKER = "AAPL";

export async function fetchAaplCloses(apiKey: string): Promise<Close[]> {
  // An identifier filter means one security search, no issuer fan-out.
  const matches = await FetchSecurity(
    null,
    null,
    HOMEPAGE_TICKER,
    "EXCH_TICKER",
    undefined,
    undefined,
    apiKey
  );
  const sec = matches.find((s) => s.uuidHex && s.uuidStr);
  if (!sec) return [];

  const filter = new PositionFilter();
  // Same cast as /data/prices: the wrapper's addObjectFilter declares only
  // Identifier, but the runtime accepts a UUID for SECURITY_ID.
  filter.addObjectFilter(
    FieldProto.SECURITY_ID,
    new UUID(UUID.fromString(sec.uuidStr!)) as unknown as Identifier
  );

  const prices = await new PriceService(apiKey).search(
    ZonedDateTime.now().toProto(),
    filter
  );
  // Sort on the timestamp before it is dropped.
  return prices
    .map((p) => ({
      asOfMs: p.getAsOf().toDateTime().toMillis(),
      close: p.getPrice().toNumber(),
    }))
    .sort((a, b) => a.asOfMs - b.asOfMs)
    .map(({ asOfMs, close }) => ({
      date: new Date(asOfMs).toISOString().slice(0, 10),
      close,
    }));
}
