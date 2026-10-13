/**
 * Probe-portfolio lifecycle for the portfolios e2e spec (US-211).
 *
 * The spec creates one `qa-221-probe-<timestamp>` portfolio per run and
 * must delete it again so e2e runs leave no ledger data behind. This
 * module holds every piece of that contract that can live outside
 * Playwright, so the vitest suite in `./probe-cleanup.test.ts` covers it
 * against a stubbed ledger:
 *
 * - `isProbeName` — anchored `qa-*-probe-*` full-name match. Only names
 *   that match end to end are ever deleted; `RandomPortfolio 0`,
 *   `qa-221-other` and `xqa-221-probe-y` never match.
 * - Age source — the portfolio `asOf` returned by `Search` is primary;
 *   the base36 `Date.now()` suffix in the name is the fallback. An entry
 *   with neither (e.g. `qa-221-probe-latest` with no usable timestamp) is
 *   skipped: never deleted, never a crash.
 * - `deleteProbe` — deletes one owned probe with the portfolio service
 *   `Delete` RPC. Refuses non-probe names and transaction-linked probes.
 * - `sweepStaleProbes` — deletes stale probes left behind by crashed runs.
 *
 * Every live call goes through the broker at `BROKER_URL` — the same path
 * the create uses — carrying the same `x-fintekkers-tenant` routing header
 * and `x-api-key` the app sends. Nothing here calls a backend service directly, touches
 * transactions or securities, or runs SQL.
 */

import grpc from "@grpc/grpc-js";
import { readFileSync } from "fs";

export const BROKER_URL = "127.0.0.1:8085";
export const PROBE_RETENTION_MS = 3_600_000;

// Same routing header the app sends on every outbound gRPC call
// (src/lib/grpc-auth.ts `getServiceConnection`: the tenant
// interceptor). The broker uses it to pick the ledger-service URL,
// so the raw client here must send it too — otherwise the call may
// never reach the ledger the UI reads. Value mirrors
// `getTenantHeaderValue` (`FINTEKKERS_TENANT ?? "production"`); kept
// local so this module stays free of the `$lib` alias, which
// Playwright specs cannot resolve.
const TENANT_HEADER = "x-fintekkers-tenant";

function tenantValue(): string {
  return process.env.FINTEKKERS_TENANT ?? "production";
}

// The broker authenticates every call by this header (src/lib/grpc-auth.ts
// `getAuthenticatedInterceptor`); the app keeps the key in this cookie.
const API_KEY_HEADER = "x-api-key";
const API_KEY_COOKIE = "ft_api_key";

const PROBE_NAME_RE = /^qa-.+-probe-.+$/;
const PROBE_SUFFIX_RE = /^[0-9a-z]+$/i;
const PROBE_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;
const PROBE_TIMESTAMP_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;
const TRANSACTION_CHECK_LIMIT = 100;

export interface ProbePortfolio {
  name: string;
  asOfMs: number | null;
  uuidHex: string | null;
}

export interface ProbeEntry {
  name: string;
  asOfMs?: number | null;
}

export interface ProbeLedger {
  createOrUpdatePortfolio(name: string): Promise<void>;
  searchPortfolios(): Promise<ProbePortfolio[]>;
  hasLinkedTransactions(name: string): Promise<boolean>;
  deletePortfolio(name: string): Promise<void>;
}

export interface CleanupOptions {
  log?: (message: string) => void;
}

export interface SweepOptions extends CleanupOptions {
  nowMs?: number;
  retentionMs?: number;
}

function defaultLog(message: string): void {
  console.error(message);
}

export function isProbeName(name: unknown): name is string {
  return typeof name === "string" && PROBE_NAME_RE.test(name);
}

export function probeTimestampMs(
  name: string,
  nowMs: number = Date.now()
): number | null {
  if (typeof name !== "string") return null;
  const marker = "-probe-";
  const idx = name.lastIndexOf(marker);
  if (idx < 0) return null;
  const suffix = name.slice(idx + marker.length);
  if (!PROBE_SUFFIX_RE.test(suffix)) return null;
  const ts = parseInt(suffix, 36);
  if (!Number.isSafeInteger(ts) || ts <= 0) return null;
  if (ts > nowMs + PROBE_TIMESTAMP_SKEW_MS) return null;
  if (ts < nowMs - PROBE_TIMESTAMP_MAX_AGE_MS) return null;
  return ts;
}

export function probeAgeMs(
  name: string,
  asOfMs: number | null | undefined,
  nowMs: number = Date.now()
): number | null {
  if (
    typeof asOfMs === "number" &&
    Number.isFinite(asOfMs) &&
    asOfMs > 0 &&
    asOfMs <= nowMs + PROBE_TIMESTAMP_SKEW_MS
  ) {
    return nowMs - asOfMs;
  }
  const ts = probeTimestampMs(name, nowMs);
  return ts === null ? null : nowMs - ts;
}

export function isStaleProbe(
  portfolio: ProbeEntry,
  nowMs: number = Date.now(),
  retentionMs: number = PROBE_RETENTION_MS
): boolean {
  if (portfolio === null || portfolio === undefined) return false;
  if (!isProbeName(portfolio.name)) return false;
  const age = probeAgeMs(portfolio.name, portfolio.asOfMs ?? null, nowMs);
  return age !== null && age > retentionMs;
}

export function makeProbeName(nowMs: number = Date.now()): string {
  return `qa-221-probe-${nowMs.toString(36)}`;
}

export async function createProbe(
  ledger: ProbeLedger,
  name: string
): Promise<void> {
  if (!isProbeName(name)) {
    throw new Error(
      `probe-cleanup: refusing to create "${name}": not a qa-*-probe-* name`
    );
  }
  await ledger.createOrUpdatePortfolio(name);
}

async function isSafeToDelete(
  ledger: ProbeLedger,
  name: string,
  log: (message: string) => void
): Promise<boolean> {
  let linked: boolean;
  try {
    linked = await ledger.hasLinkedTransactions(name);
  } catch (err: any) {
    const detail = err?.message ?? String(err);
    log(
      `probe-cleanup: transaction check failed for "${name}" ` +
        `(${detail}); refusing to delete`
    );
    return false;
  }
  if (linked) {
    log(
      `probe-cleanup: refusing to delete "${name}": it has linked transactions`
    );
    return false;
  }
  return true;
}

export async function deleteProbe(
  ledger: ProbeLedger,
  name: string,
  options: CleanupOptions = {}
): Promise<void> {
  const log = options.log ?? defaultLog;
  if (!isProbeName(name)) {
    throw new Error(
      `probe-cleanup: refusing to delete "${name}": not a qa-*-probe-* portfolio`
    );
  }
  if (!(await isSafeToDelete(ledger, name, log))) {
    throw new Error(
      `probe-cleanup: refusing to delete "${name}": linked transactions ` +
        `are present or could not be ruled out`
    );
  }
  await ledger.deletePortfolio(name);
}

export async function sweepStaleProbes(
  ledger: ProbeLedger,
  options: SweepOptions = {}
): Promise<string[]> {
  const nowMs = options.nowMs ?? Date.now();
  const retentionMs = options.retentionMs ?? PROBE_RETENTION_MS;
  const log = options.log ?? defaultLog;
  const portfolios = await ledger.searchPortfolios();
  const stale = portfolios.filter((p) => isStaleProbe(p, nowMs, retentionMs));
  const deleted: string[] = [];
  const refused: string[] = [];
  for (const portfolio of stale) {
    if (await isSafeToDelete(ledger, portfolio.name, log)) {
      await ledger.deletePortfolio(portfolio.name);
      deleted.push(portfolio.name);
    } else {
      refused.push(portfolio.name);
    }
  }
  if (refused.length > 0) {
    throw new Error(
      `probe-cleanup: refused to delete ${refused.length} probe ` +
        `portfolio(s) with linked or unverifiable transactions: ` +
        refused.join(", ")
    );
  }
  return deleted;
}

// --- Live broker client (Playwright e2e only; stubbed in vitest) ---

type AnyModule = { [key: string]: any };

interface LedgerModules {
  PortfolioClient: any;
  QueryPortfolioRequestProto: any;
  CreatePortfolioRequestProto: any;
  PortfolioProto: any;
  TransactionClient: any;
  QueryTransactionRequestProto: any;
  DeleteRequestProto: any;
  EntityTypeProto: any;
  UUIDProto: any;
  PositionFilter: any;
  FieldProto: any;
  UUID: any;
  ZonedDateTime: any;
  ObjectTypeProto: any;
  stamp: any;
}

function pick(mod: AnyModule, name: string): any {
  const value = mod?.[name] ?? mod?.default?.[name];
  if (value === undefined || value === null) {
    throw new Error(
      `probe-cleanup: ledger-models module is missing export "${name}"`
    );
  }
  return value;
}

let cachedLedgerModules: LedgerModules | null = null;

async function ledgerModules(): Promise<LedgerModules> {
  if (cachedLedgerModules !== null) return cachedLedgerModules;
  // ESM dynamic-import-of-CJS quirk: the proto modules export named
  // bindings the linker doesn't always destructure, so go through
  // `default` / `module` shapes defensively (same pattern as the spec
  // this helper was extracted from).
  const portfolioGrpc: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb.js"
  );
  const portfolioQuery: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/requests/portfolio/query_portfolio_request_pb.js"
  );
  const portfolioCreate: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/requests/portfolio/create_portfolio_request_pb.js"
  );
  const portfolioProto: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb.js"
  );
  const transactionGrpc: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/services/transaction-service/transaction_service_grpc_pb.js"
  );
  const transactionQuery: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/requests/transaction/query_transaction_request_pb.js"
  );
  const deleteProto: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/requests/util/delete_request_pb.js"
  );
  const uuidProto: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js"
  );
  const filterMod: AnyModule = await import(
    "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter.js"
  );
  const fieldMod: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js"
  );
  const uuidMod: AnyModule = await import(
    "@fintekkers/ledger-models/node/wrappers/models/utils/uuid.js"
  );
  const datetimeMod: AnyModule = await import(
    "@fintekkers/ledger-models/node/wrappers/models/utils/datetime.js"
  );
  const objectTypeProto: AnyModule = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/util/object_type_pb.js"
  );
  const objectTypesMod: AnyModule = await import(
    "@fintekkers/ledger-models/node/wrappers/util/object-types.js"
  );
  cachedLedgerModules = {
    PortfolioClient: pick(portfolioGrpc, "PortfolioClient"),
    QueryPortfolioRequestProto: pick(
      portfolioQuery,
      "QueryPortfolioRequestProto"
    ),
    CreatePortfolioRequestProto: pick(
      portfolioCreate,
      "CreatePortfolioRequestProto"
    ),
    PortfolioProto: pick(portfolioProto, "PortfolioProto"),
    TransactionClient: pick(transactionGrpc, "TransactionClient"),
    QueryTransactionRequestProto: pick(
      transactionQuery,
      "QueryTransactionRequestProto"
    ),
    DeleteRequestProto: pick(deleteProto, "DeleteRequestProto"),
    EntityTypeProto: pick(deleteProto, "EntityTypeProto"),
    UUIDProto: pick(uuidProto, "UUIDProto"),
    PositionFilter: pick(filterMod, "PositionFilter"),
    FieldProto: fieldMod.FieldProto ?? fieldMod.default?.FieldProto,
    UUID: pick(uuidMod, "UUID"),
    ZonedDateTime: pick(datetimeMod, "ZonedDateTime"),
    ObjectTypeProto: pick(objectTypeProto, "ObjectTypeProto"),
    stamp: pick(objectTypesMod, "stamp"),
  };
  if (!cachedLedgerModules.FieldProto) {
    throw new Error(
      'probe-cleanup: ledger-models module is missing export "FieldProto"'
    );
  }
  return cachedLedgerModules;
}

function asOfToMs(asOf: any): number | null {
  try {
    if (asOf === null || asOf === undefined) return null;
    if (typeof asOf.toDate === "function") {
      const time = asOf.toDate().getTime();
      return typeof time === "number" && Number.isFinite(time) ? time : null;
    }
    const parsed = Date.parse(String(asOf));
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function uuidHexOf(uuidProto: any): string | null {
  try {
    if (uuidProto === null || uuidProto === undefined) return null;
    return Buffer.from(uuidProto.serializeBinary()).toString("hex");
  } catch {
    return null;
  }
}

function grpcError(err: any): Error {
  return new Error(`${err.code}: ${err.details ?? err.message}`);
}

export function brokerMetadata(apiKey: string | undefined): grpc.Metadata {
  const metadata = new grpc.Metadata();
  metadata.add(TENANT_HEADER, tenantValue());
  // The broker rejects every ledger call without the caller's key.
  if (apiKey) metadata.add(API_KEY_HEADER, apiKey);
  return metadata;
}

async function grpcCreatePortfolio(
  brokerUrl: string,
  apiKey: string | undefined,
  name: string
): Promise<void> {
  const mods = await ledgerModules();
  const portfolio = new mods.PortfolioProto();
  mods.stamp(portfolio, mods.ObjectTypeProto.OBJECT_TYPE_PORTFOLIO);
  portfolio.setAsOf(mods.ZonedDateTime.now().toProto());
  portfolio.setPortfolioName(name);
  portfolio.setUuid(mods.UUID.random().toUUIDProto());

  const req = new mods.CreatePortfolioRequestProto();
  mods.stamp(req, mods.ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST);
  req.setCreatePortfolioInput(portfolio);

  const client = new mods.PortfolioClient(
    brokerUrl,
    grpc.credentials.createInsecure()
  );
  await new Promise<void>((resolve, reject) => {
    client.createOrUpdate(req, brokerMetadata(apiKey), (err: any) => {
      if (err) reject(grpcError(err));
      else resolve();
    });
  });
}

async function grpcSearchPortfolios(
  brokerUrl: string,
  apiKey: string | undefined
): Promise<ProbePortfolio[]> {
  const mods = await ledgerModules();
  const client = new mods.PortfolioClient(
    brokerUrl,
    grpc.credentials.createInsecure()
  );
  const req = new mods.QueryPortfolioRequestProto();
  mods.stamp(req, mods.ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST);
  req.setAsOf(mods.ZonedDateTime.now().toProto());
  req.setSearchPortfolioInput(new mods.PositionFilter().toProto());

  const found: ProbePortfolio[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = client.search(req, brokerMetadata(apiKey));
    stream.on("data", (resp: any) => {
      const list = resp.getPortfolioResponseList?.() ?? [];
      for (const p of list) {
        try {
          found.push({
            name: p.getPortfolioName?.() ?? "",
            asOfMs: asOfToMs(p.getAsOf?.()),
            uuidHex: uuidHexOf(p.getUuid?.()),
          });
        } catch {
          // Skip one malformed row rather than failing the whole sweep
          // (same per-row guard as the portfolios page).
        }
      }
    });
    stream.on("end", () => resolve());
    stream.on("error", (err: any) => reject(grpcError(err)));
  });
  return found;
}

async function grpcHasLinkedTransactions(
  brokerUrl: string,
  apiKey: string | undefined,
  name: string
): Promise<boolean> {
  const mods = await ledgerModules();
  const client = new mods.TransactionClient(
    brokerUrl,
    grpc.credentials.createInsecure()
  );
  // Same filter the transactions grid reads back through
  // `Transaction.getPortfolio().getPortfolioName()`: the transaction's
  // embedded portfolio name. Request shape mirrors wrapper
  // `TransactionService.searchTransaction`, which the transactions page
  // exercises on every load.
  const filter = new mods.PositionFilter();
  filter.addEqualsFilter(mods.FieldProto.PORTFOLIO_NAME, name);
  const req = new mods.QueryTransactionRequestProto();
  mods.stamp(req, mods.ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST);
  req.setAsOf(mods.ZonedDateTime.now().toProto());
  req.setSearchTransactionInput(filter.toProto());
  req.setLimit(TRANSACTION_CHECK_LIMIT);

  let count = 0;
  await new Promise<void>((resolve, reject) => {
    const stream = client.search(req, brokerMetadata(apiKey));
    stream.on("data", (resp: any) => {
      count += resp.getTransactionResponseList?.()?.length ?? 0;
    });
    stream.on("end", () => resolve());
    stream.on("error", (err: any) => reject(grpcError(err)));
  });
  return count > 0;
}

async function grpcDeletePortfolio(
  brokerUrl: string,
  apiKey: string | undefined,
  name: string
): Promise<void> {
  const portfolios = await grpcSearchPortfolios(brokerUrl, apiKey);
  const target = portfolios.find((p) => p.name === name);
  if (!target) return;
  if (!target.uuidHex) {
    throw new Error(
      `probe-cleanup: portfolio "${name}" has no UUID; refusing to delete`
    );
  }
  const mods = await ledgerModules();
  const request = new mods.DeleteRequestProto();
  mods.stamp(request, mods.ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST);
  request.setUuid(
    mods.UUIDProto.deserializeBinary(
      new Uint8Array(Buffer.from(target.uuidHex, "hex"))
    )
  );
  request.setEntityType(mods.EntityTypeProto.PORTFOLIO);
  const client = new mods.PortfolioClient(
    brokerUrl,
    grpc.credentials.createInsecure()
  );
  await new Promise<void>((resolve, reject) => {
    client.delete(request, brokerMetadata(apiKey), (err: any) => {
      if (err) reject(grpcError(err));
      else resolve();
    });
  });
}

export function createGrpcProbeLedger(
  brokerUrl: string = BROKER_URL,
  apiKey?: string
): ProbeLedger {
  return {
    createOrUpdatePortfolio: (name: string) =>
      grpcCreatePortfolio(brokerUrl, apiKey, name),
    searchPortfolios: () => grpcSearchPortfolios(brokerUrl, apiKey),
    hasLinkedTransactions: (name: string) =>
      grpcHasLinkedTransactions(brokerUrl, apiKey, name),
    deletePortfolio: (name: string) =>
      grpcDeletePortfolio(brokerUrl, apiKey, name),
  };
}

/**
 * The test user's broker API key: the `ft_api_key` cookie in the
 * Playwright storageState the chromium project logs in with
 * (scripts/checks/e2e.sh and auth.setup.ts write it). Returns undefined
 * when the file or cookie is missing; the broker then rejects the call
 * with "API key required".
 */
export function apiKeyFromStorageState(path: string): string | undefined {
  let state: any;
  try {
    state = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
  const cookies = Array.isArray(state?.cookies) ? state.cookies : [];
  const cookie = cookies.find((c: any) => c?.name === API_KEY_COOKIE);
  return typeof cookie?.value === "string" && cookie.value !== ""
    ? cookie.value
    : undefined;
}
