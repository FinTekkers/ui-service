/**
 * US-309: the live SOMA position searches for the H.4.1 week of Wednesday
 * 2026-11-04, recorded from the broker in one run by
 * scripts/record-soma-week.ts (soma-2026-11-04.positions.json): the week by
 * PRODUCT_TYPE × MATURITY_DATE (the search before US-309), the week by
 * IDENTIFIER too (the search now), and the year-ago week, 2025-11-05.
 *
 * Oracles:
 * - soma-2026-11-04.ledger-par.json: par per CUSIP from market-data-inputs'
 *   soma.prove_positions (its header names the commit), which matched the
 *   NY Fed feed on all 434 CUSIPs.
 * - soma-2026-11-04.view-before.json: somaRowsToView's snapshot, findings
 *   and maturity on the coarse search, at the commit before US-309.
 */
import { gunzipSync } from "zlib";
import { PositionProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import { Position } from "@fintekkers/ledger-models/node/wrappers/models/position/position";
import { somaRowOf, type SomaRow } from "../../lib/server/free-soma";
import recording from "./soma-2026-11-04.positions.json";
import ledgerPar from "./soma-2026-11-04.ledger-par.json";
import viewBefore from "./soma-2026-11-04.view-before.json";

/** One recorded search's positions: PositionProto bytes, each after its
 * 4-byte big-endian length, gzipped, in base64. */
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

export const AS_OF = recording.asOf;
export const PRIOR_AS_OF = recording.priorAsOf;

/** The broker's positions, as the page's searches return them. */
export const FINE_POSITIONS = decode(recording.fine);
export const PRIOR_POSITIONS = decode(recording.prior);

export const COARSE_ROWS: SomaRow[] = decode(recording.coarse).map(somaRowOf);
export const FINE_ROWS: SomaRow[] = FINE_POSITIONS.map(somaRowOf);
export const PRIOR_ROWS: SomaRow[] = PRIOR_POSITIONS.map(somaRowOf);

/** CUSIP → par, dollars, from soma.prove_positions. */
export const LEDGER_PAR: Record<string, string> = ledgerPar.par;

export const VIEW_BEFORE = {
  snapshot: viewBefore.snapshot,
  findings: viewBefore.findings,
  maturity: viewBefore.maturity,
};
