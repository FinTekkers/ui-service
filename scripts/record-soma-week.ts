/**
 * US-309: records one H.4.1 week's SOMA position searches from the live
 * broker, for src/tests/fixtures/soma-<week>.positions.json. One run, one
 * after the other: the week by PRODUCT_TYPE × MATURITY_DATE (the coarse
 * search /free/soma ran before US-309), the week by IDENTIFIER too (the one
 * it runs now), and the year-ago week (coarse). Each position is kept as
 * PositionProto bytes holding only its fields and measures, so tests decode
 * it through the real somaRowOf. Each search is one string: the bytes,
 * each after its 4-byte big-endian length, gzipped, in base64 (the repeated
 * Any type URLs make the plain bytes ~17× larger).
 *
 * Run with the page's key, which it never prints:
 *   set -a; . /etc/fintekkers/homepage-key.env; set +a
 *   BROKER_HOST=127.0.0.1:8085 npx vite-node --config vitest.config.js \
 *     scripts/record-soma-week.ts 2026-11-04
 * (vitest.config.js, not vite.config's ssr.noExternal, which breaks the
 * grpc-js interop under vite-node.)
 */
import { writeFileSync } from "fs";
import { gzipSync } from "zlib";
import { PositionProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import { searchPositions } from "../src/lib/positions";
import {
  PRIOR_WEEK_DAYS,
  SOMA_FIELDS,
  SOMA_POSITION_FIELDS,
  somaRequest,
} from "../src/lib/server/free-soma";

const asOf = process.argv[2];
const key = process.env.FT_HOMEPAGE_API_KEY?.trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf ?? "") || !key) {
  console.error("usage: FT_HOMEPAGE_API_KEY=… record-soma-week.ts YYYY-MM-DD");
  process.exit(2);
}
const priorAsOf = new Date(Date.parse(asOf) - PRIOR_WEEK_DAYS * 86_400_000)
  .toISOString()
  .slice(0, 10);

async function record(
  week: string,
  fields: number[]
): Promise<{ count: number; positions: string }> {
  const positions = await searchPositions(
    somaRequest(week, fields).toProto(),
    key
  );
  const parts = positions.flatMap((p) => {
    const bytes = new PositionProto()
      .setFieldsList(p.getFields())
      .setMeasuresList(p.getMeasures())
      .serializeBinary();
    const length = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    return [length, Buffer.from(bytes)];
  });
  return {
    count: positions.length,
    positions: gzipSync(Buffer.concat(parts), { level: 9 }).toString("base64"),
  };
}

const coarse = await record(asOf, SOMA_FIELDS);
const fine = await record(asOf, SOMA_POSITION_FIELDS);
const prior = await record(priorAsOf, SOMA_FIELDS);
const out = `src/tests/fixtures/soma-${asOf}.positions.json`;
writeFileSync(
  out,
  JSON.stringify(
    {
      source: `scripts/record-soma-week.ts, broker Position/Search with FT_HOMEPAGE_API_KEY, ${new Date().toISOString()}`,
      asOf,
      priorAsOf,
      coarse,
      fine,
      prior,
    },
    null,
    2
  ) + "\n"
);
console.log(
  `${out}: coarse=${coarse.count} fine=${fine.count} prior=${prior.count}`
);
