/**
 * Google SSO sign-in provisions the broker API key server-side. Since
 * broker-service BS-3, an existing account is only served with proof of
 * ownership or the admin credential, so brokerProvisionApiKey must present
 * BROKER_ADMIN_KEY as x-admin-key. Without it, a returning SSO user gets
 * "Account already exists" and no API key.
 *
 * Runs against an in-process fake Auth service, so it needs no broker.
 */
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import fs from "fs";
import os from "os";
import path from "path";

const PROTO = `syntax = "proto3";
package fintekkers.services.auth;
service Auth {
  rpc ProvisionApiKey (ProvisionApiKeyRequest) returns (ProvisionApiKeyResponse);
}
message ProvisionApiKeyRequest { string email = 1; string name = 2; string signup_code = 3; }
message ProvisionApiKeyResponse { string api_key = 1; string user_id = 2; string message = 3; }
`;

let server: grpc.Server;
let seenAdminKeys: (string | undefined)[] = [];

beforeAll(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sso-admin-key-"));
  const protoPath = path.join(dir, "auth.proto");
  fs.writeFileSync(protoPath, PROTO);
  const pkg = grpc.loadPackageDefinition(
    protoLoader.loadSync(protoPath)
  ) as any;

  server = new grpc.Server();
  server.addService(pkg.fintekkers.services.auth.Auth.service, {
    ProvisionApiKey: (call: any, callback: any) => {
      const key = call.metadata.get("x-admin-key")[0];
      seenAdminKeys.push(key === undefined ? undefined : String(key));
      if (key === undefined) {
        callback({
          code: grpc.status.ALREADY_EXISTS,
          details: "Account already exists",
        });
      } else {
        callback(null, { apiKey: "key-123", userId: "user-1", message: "ok" });
      }
    },
  });
  const port = await new Promise<number>((resolve, reject) =>
    server.bindAsync(
      "127.0.0.1:0",
      grpc.ServerCredentials.createInsecure(),
      (err, p) => (err ? reject(err) : resolve(p))
    )
  );
  vi.stubEnv("BROKER_HOST", `127.0.0.1:${port}`);
  vi.stubEnv("BROKER_PROTO_PATH", protoPath);
});

afterEach(() => {
  seenAdminKeys = [];
});

afterAll(() => {
  vi.unstubAllEnvs();
  server.forceShutdown();
});

async function provision() {
  vi.resetModules(); // grpc-auth reads BROKER_HOST and the proto path at load
  const { brokerProvisionApiKey } = await import("$lib/grpc-auth");
  return brokerProvisionApiKey(
    "returning@example.com",
    "Returning User",
    "S1GNUP"
  );
}

describe("SSO API key provisioning presents the admin credential", () => {
  test("with BROKER_ADMIN_KEY set, the key is sent and a returning user gets an API key", async () => {
    vi.stubEnv("BROKER_ADMIN_KEY", "  admin-secret  ");
    const result = await provision();
    expect(seenAdminKeys).toEqual(["admin-secret"]);
    expect(result).toEqual({
      success: true,
      apiKey: "key-123",
      userId: "user-1",
    });
  });

  test("without BROKER_ADMIN_KEY, no x-admin-key header is sent", async () => {
    vi.stubEnv("BROKER_ADMIN_KEY", "");
    const result = await provision();
    expect(seenAdminKeys).toEqual([undefined]);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Account already exists");
  });
});
