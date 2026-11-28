/**
 * US-365: Maturity mix over time's live search up to Wednesday 2026-11-18,
 * recorded from the broker by `scripts/record-soma-week.ts 2026-11-18 --mix`
 * (soma-2026-11-18.mix.json): every SOMA trade by TRADE_DATE, PRODUCT_TYPE
 * and MATURITY_DATE, with DIRECTED_QUANTITY. Its oracle is the item's
 * reference table, computed independently from the ledger on 28 Nov
 * (MIX_REFERENCE).
 */
import { gunzipSync } from "zlib";
import { PositionProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import { Position } from "@fintekkers/ledger-models/node/wrappers/models/position/position";
import { somaMixRowOf } from "../../lib/server/free-soma";
import type { SomaMixRow } from "../../lib/server/soma-mix";
import recording from "./soma-2026-11-18.mix.json";

/** The recorded positions: PositionProto bytes, each after its 4-byte
 * big-endian length, gzipped, in base64 (as soma-2026-11-04.ts). */
function decode(search: { count: number; positions: string }): Position[] {
  const bytes = gunzipSync(Buffer.from(search.positions, "base64"));
  const out: Position[] = [];
  for (let i = 0; i < bytes.length; ) {
    const n = bytes.readUInt32BE(i);
    out.push(
      new Position(
        // A copy: under jsdom a Node Buffer is not the Uint8Array
        // google-protobuf checks for.
        PositionProto.deserializeBinary(
          new Uint8Array(bytes.subarray(i + 4, i + 4 + n))
        )
      )
    );
    i += 4 + n;
  }
  if (out.length !== search.count) throw new Error("truncated recording");
  return out;
}

export const MIX_AS_OF = recording.asOf;

/** The mix search's positions, as the broker returned them. */
export const MIX_POSITIONS = decode(recording.mix);
export const MIX_ROWS: SomaMixRow[] = MIX_POSITIONS.map(somaMixRowOf);

/** Week → under-1-year share (%) and average remaining maturity (years). */
export const MIX_REFERENCE: Record<
  string,
  { under1: number; avgYears: number }
> = {
  "2007-06-27": { under1: 50.8, avgYears: 3.5 },
  "2014-10-29": { under1: 0.1, avgYears: 9.7 },
  "2025-11-26": { under1: 16.7, avgYears: 9.0 },
  "2026-11-18": { under1: 23.4, avgYears: 8.1 },
};
