/**
 * CPI-U data precondition for the TIPS Pricer e2e spec (US-229).
 *
 * Asks the price service, over the broker, for the latest month of CPI-U
 * NSA (SERIES_ID CUUR0000SA0) it holds, so the spec can pick a settlement
 * date whose m-3 and m-2 readings exist without hard-coding one. Like
 * data-preconditions.ts, the answer never comes from the page under test,
 * and any gRPC error rejects: an outage fails the test, never skips it.
 * No `$lib` imports: Playwright cannot resolve that alias.
 */
import grpc from "@grpc/grpc-js";
import { STORAGE_STATE_PATH } from "./auth";
import {
  BROKER_URL,
  PRECONDITION_DEADLINE_MS,
  apiKeyFromStorageState,
  brokerMetadata,
} from "../../../src/tests/probe-cleanup";

type AnyModule = any;

function pick(mod: AnyModule, name: string): any {
  const value = mod?.[name] ?? mod?.default?.[name];
  if (value === undefined || value === null) {
    throw new Error(`cpi-preconditions: missing ledger-models export ${name}`);
  }
  return value;
}

export type YearMonth = { year: number; month: number };

function collect(stream: any, rowsOf: (resp: any) => any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    stream.on("data", (resp: any) => rows.push(...rowsOf(resp)));
    stream.on("end", () => resolve(rows));
    stream.on("error", (err: any) =>
      reject(new Error(`${err.code}: ${err.details ?? err.message}`))
    );
  });
}

/** Latest CPI-U NSA month in the price service, or null when it has none. */
export async function latestCpiUMonth(
  brokerUrl: string = BROKER_URL
): Promise<YearMonth | null> {
  const securityGrpc = await import(
    "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js"
  );
  const securityQuery = await import(
    "@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js"
  );
  const priceGrpc = await import(
    "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js"
  );
  const priceQuery = await import(
    "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js"
  );
  const productType = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js"
  );
  const identifierType = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js"
  );
  const fieldMod: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js"
  );
  const filterMod = await import(
    "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter.js"
  );
  const datetimeMod = await import(
    "@fintekkers/ledger-models/node/wrappers/models/utils/datetime.js"
  );
  const objectTypesMod = await import(
    "@fintekkers/ledger-models/node/wrappers/util/object-types.js"
  );
  const uuidMod = await import(
    "@fintekkers/ledger-models/node/wrappers/models/utils/uuid.js"
  );
  const FieldProto = fieldMod.FieldProto ?? fieldMod.default?.FieldProto;
  const PositionFilter = pick(filterMod, "PositionFilter");
  const ZonedDateTime = pick(datetimeMod, "ZonedDateTime");
  const stampOwn = pick(objectTypesMod, "stampOwn");
  const metadata = brokerMetadata(apiKeyFromStorageState(STORAGE_STATE_PATH));
  const deadline = () => ({ deadline: Date.now() + PRECONDITION_DEADLINE_MS });

  const securityClient = new (pick(securityGrpc, "SecurityClient"))(
    brokerUrl,
    grpc.credentials.createInsecure()
  );
  const priceClient = new (pick(priceGrpc, "PriceClient"))(
    brokerUrl,
    grpc.credentials.createInsecure()
  );
  try {
    const secFilter = new PositionFilter();
    secFilter.addEqualsFilter(FieldProto.ASSET_CLASS, "RATES");
    const secReq = new (pick(securityQuery, "QuerySecurityRequestProto"))();
    stampOwn(secReq);
    secReq.setAsOf(ZonedDateTime.now().toProto());
    secReq.setSearchSecurityInput(secFilter.toProto());
    const securities = await collect(
      securityClient.search(secReq, metadata, deadline()),
      (resp) => resp.getSecurityResponseList()
    );
    const SERIES_ID = pick(identifierType, "IdentifierTypeProto").SERIES_ID;
    const CPI_SERIES = pick(productType, "ProductTypeProto").CPI_SERIES;
    const series = securities.find(
      (s: any) =>
        s.getProductType() === CPI_SERIES &&
        s
          .getIdentifiersList()
          .some(
            (id: any) =>
              id.getIdentifierType() === SERIES_ID &&
              id.getIdentifierValue() === "CUUR0000SA0"
          )
    );
    if (!series) return null;

    const priceFilter = new PositionFilter();
    priceFilter.addObjectFilter(
      FieldProto.SECURITY_ID,
      new (pick(uuidMod, "UUID"))(
        Array.from(series.getUuid().getRawUuid_asU8())
      )
    );
    const priceReq = new (pick(priceQuery, "QueryPriceRequestProto"))();
    stampOwn(priceReq);
    priceReq.setAsOf(ZonedDateTime.now().toProto());
    priceReq.setHorizon(
      pick(priceQuery, "PriceHorizonProto").PRICE_HORIZON_MAX
    );
    priceReq.setSearchPriceInput(priceFilter.toProto());
    const prices = await collect(
      priceClient.search(priceReq, metadata, deadline()),
      (resp) => resp.getPriceResponseList()
    );
    const latestMs = Math.max(
      ...prices.map((p: any) => p.getAsOf().getTimestamp().getSeconds() * 1000)
    );
    if (!Number.isFinite(latestMs)) return null;
    const d = new Date(latestMs);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  } finally {
    securityClient.close();
    priceClient.close();
  }
}
