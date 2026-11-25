/**
 * Every daily close the price service holds for one exchange ticker,
 * oldest first: one security search by EXCH_TICKER, then one price search
 * by SECURITY_ID, through the broker with the caller's key. Shared by the
 * homepage chart (US-250) and /free/tech-vs-sp500 (US-339). Lives under
 * src/lib/server/ so SvelteKit refuses any client import of it. An unknown
 * ticker gives []; errors propagate to the caller's loader.
 */
import { FetchSecurity } from "$lib/security";
import type { Close } from "$lib/free/techVsSp500";
import type { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { PriceService } from "@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";

const { FieldProto } = field_pkg;

export type { Close } from "$lib/free/techVsSp500";

export async function fetchClosesByTicker(
  ticker: string,
  apiKey: string
): Promise<Close[]> {
  // An identifier filter means one security search, no issuer fan-out.
  const matches = await FetchSecurity(
    null,
    null,
    ticker,
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
