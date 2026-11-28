/**
 * US-354: seeds the CoreWeave 9.25% 2030 notes (ISIN USU2069EAA83) for
 * /free/corporate-bond/crwv-2030; see scripts/lib/seed-crwv-2030.ts. Safe to
 * run again: a second run reports "noop" and writes nothing.
 *
 * Run with a key that may write to the ledger, which it never prints:
 *   set -a; . <host env file with FT_SEED_API_KEY>; set +a
 *   BROKER_HOST=127.0.0.1:8085 npx vite-node --config vitest.config.js \
 *     scripts/seed-crwv-2030.ts
 */
import { SecurityClient } from "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js";
import { QuerySecurityRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js";
import { CreateSecurityRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/security/create_security_request_pb.js";
import type { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { IdentifierProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { validateIdentifiersForCreate } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { requireValid } from "@fintekkers/ledger-models/node/wrappers/models/security/security_rules";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import { getServiceConnection } from "../src/lib/grpc-auth";
import { main, type SeedDeps } from "./lib/seed-crwv-2030";

const { FieldProto } = field_pkg;

function brokerDeps(apiKey: string): SeedDeps {
  const conn = getServiceConnection(apiKey);
  const client = new SecurityClient(conn.url, conn.credentials, {
    interceptors: conn.interceptors,
    ...conn.clientOptions,
  });
  const search = (type: IdentifierTypeProto, value: string) => {
    const filter = new PositionFilter();
    filter.addObjectFilter(
      FieldProto.IDENTIFIER,
      new Identifier(
        new IdentifierProto().setIdentifierType(type).setIdentifierValue(value)
      )
    );
    const request = new QuerySecurityRequestProto();
    stampOwn(request);
    request.setAsOf(ZonedDateTime.now().toProto());
    request.setSearchSecurityInput(filter.toProto());
    return new Promise<SecurityProto[]>((resolve, reject) => {
      const list: SecurityProto[] = [];
      const stream = client.search(request);
      stream.on("data", (response) =>
        list.push(...response.getSecurityResponseList())
      );
      stream.on("end", () => resolve(list));
      stream.on("error", reject);
    });
  };
  return {
    search: (isin) => search(IdentifierTypeProto.ISIN, isin),
    usd: async () => {
      const usd = (await search(IdentifierTypeProto.CASH, "USD")).find(
        (s) => s.getCashDetails()?.getCashId() === "USD"
      );
      if (!usd) throw new Error("the ledger has no USD cash security");
      return usd;
    },
    write: (security) => {
      validateIdentifiersForCreate(security);
      requireValid(security);
      const request = new CreateSecurityRequestProto();
      stampOwn(request);
      request.setSecurityInput(security);
      return new Promise<void>((resolve, reject) => {
        client.createOrUpdate(request, (err) =>
          err ? reject(err) : resolve()
        );
      });
    },
    log: (line) => console.log(line),
    error: (line) => console.error(line),
  };
}

process.exit(await main(process.env, brokerDeps));
