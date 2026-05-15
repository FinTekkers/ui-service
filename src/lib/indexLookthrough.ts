/**
 * Index lookthrough — fetch the on-the-run constituents of an index Security
 * via the server-side resolver registered on `SecurityService.GetByIds` with
 * `lookthrough=true`.
 *
 * Replaces the client-side `selectOnTheRunBonds` helper. Server-side
 * resolution (ledger-service PR #43) owns the on-the-run pick rule for any
 * registered index — Treasury Curve, S&P 500, etc. — and the UI just
 * consumes the constituents.
 *
 * Wire shape (ledger-models 0.2.5+):
 *  - Request: QuerySecurityRequestProto { uuids=[indexUuid], asOf, lookthrough=true }
 *  - Response: one SecurityProto per requested UUID. Index Securities carry
 *    `IndexDetailsProto.constituents` populated with link-mode entries
 *    (is_link=true, uuid + as_of set, no body); the caller follows up with
 *    `GetByIds(constituent_uuids)` for the full Security payloads.
 */
import { SecurityClient } from '@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js';
import { QuerySecurityRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js';
import type { SecurityProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import { getServiceConnection } from '$lib/grpc-auth';

/**
 * Deterministic UUID for the Treasury Curve index Security
 * (market-data-inputs PR #18, uuid5(namespace="...-268", "TREASURY_CURVE_INDEX")).
 *
 * Hardcoded for the loader's hot path — looking it up by
 * (IdentifierType=INDEX_NAME, value="US Treasury Curve") on every request
 * would add a round-trip on top of the lookthrough call. The constant is
 * stable across environments because the upstream creator computes the same
 * uuid5 deterministically.
 */
export const TREASURY_CURVE_INDEX_UUID = '8a6dba91-832a-501c-8d78-dc887e3acb30';

function newSecurityClient(apiKey?: string): SecurityClient {
  const conn = getServiceConnection(apiKey);
  return new SecurityClient(conn.url, conn.credentials, { interceptors: conn.interceptors, ...conn.clientOptions });
}

function buildGetByIdsRequest(
  uuidStrs: readonly string[],
  asOf: Date,
  lookthrough: boolean,
): QuerySecurityRequestProto {
  const request = new QuerySecurityRequestProto();
  request.setObjectClass('SecurityRequest');
  request.setVersion('0.0.1');
  request.setAsOf(ZonedDateTime.from(asOf).toProto());
  request.setLookthrough(lookthrough);
  for (const uuidStr of uuidStrs) {
    const uuidProto = new UUID(UUID.fromString(uuidStr)).toUUIDProto();
    request.addUuids(uuidProto);
  }
  return request;
}

function unaryGetByIds(
  client: SecurityClient,
  request: QuerySecurityRequestProto,
): Promise<SecurityProto[]> {
  return new Promise((resolve, reject) => {
    (client as any).getByIds(request, (err: any, response: any) => {
      if (err) {
        reject(err);
        return;
      }
      const list: SecurityProto[] = response?.getSecurityResponseList?.() ?? [];
      resolve(list);
    });
  });
}

/**
 * Resolve the on-the-run constituent UUIDs of an index Security as-of the
 * given date. Returns the raw UUID strings — the caller fetches full
 * SecurityProto bodies (and prices) via {@link fetchSecuritiesByUuids}.
 *
 * Empty array means the index resolver returned no constituents — either
 * because no candidates met the on-the-run rule for that asOf, or because
 * no resolver is registered for this index. The loader decides whether to
 * walk asOf backward.
 */
export async function fetchIndexConstituentUuids(
  indexUuid: string,
  asOf: Date,
  apiKey?: string,
): Promise<string[]> {
  const client = newSecurityClient(apiKey);
  const request = buildGetByIdsRequest([indexUuid], asOf, /* lookthrough */ true);
  const responses = await unaryGetByIds(client, request);
  if (responses.length === 0) return [];

  const constituentUuids: string[] = [];
  for (const proto of responses) {
    const indexDetails = proto.getIndexDetails?.();
    if (!indexDetails) continue;
    const constituents = indexDetails.getConstituentsList?.() ?? [];
    for (const c of constituents) {
      const uuidProto = c.getUuid?.();
      if (!uuidProto) continue;
      const bytes = uuidProto.getRawUuid_asU8?.();
      if (!bytes || bytes.length !== 16) continue;
      constituentUuids.push(UUID.fromU8Array(bytes).toString());
    }
  }
  return constituentUuids;
}

/**
 * Fetch full SecurityProto bodies for a set of UUIDs as-of the given date.
 * Returns wrapper Security instances (created via Security.create which
 * narrows to BondSecurity for the bond-shape product types).
 *
 * `lookthrough=false` — these are leaf constituents, not nested indices.
 * Failed records are skipped (logged) rather than aborting the batch, the
 * same pattern as the streaming Security search elsewhere in the codebase.
 */
export async function fetchSecuritiesByUuids(
  uuidStrs: readonly string[],
  asOf: Date,
  apiKey?: string,
): Promise<Security[]> {
  if (uuidStrs.length === 0) return [];
  const client = newSecurityClient(apiKey);
  const request = buildGetByIdsRequest(uuidStrs, asOf, /* lookthrough */ false);
  let responses: SecurityProto[];
  try {
    responses = await unaryGetByIds(client, request);
  } catch (err: any) {
    console.warn(`getByIds(${uuidStrs.length} uuids) failed: ${err.details ?? err.message ?? err}`);
    return [];
  }

  const out: Security[] = [];
  for (const proto of responses) {
    try { out.push(Security.create(proto)); } catch { /* skip malformed */ }
  }
  return out;
}
