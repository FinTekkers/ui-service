/**
 * Unit coverage for $lib/indexLookthrough — #268 server-side index
 * resolver consumer.
 *
 * The helper has two responsibilities and a hardcoded UUID:
 *  1. Translate a single-index UUID into a `GetByIds(uuids=[index],
 *     lookthrough=true)` request and pull the constituent UUIDs out of
 *     `IndexDetailsProto.constituents` (each entry is a link-mode
 *     Security with uuid + as_of populated, body absent).
 *  2. Re-issue `GetByIds(uuids=[…], lookthrough=false)` for the full
 *     constituent bodies and wrap them via `Security.create`.
 *
 * gRPC layer is mocked. We capture the request to verify
 * setLookthrough(true|false) is set correctly on each call, and stub
 * responses with hand-built proto-shaped fixtures.
 */
import { describe, expect, test, vi, beforeEach } from 'vitest';

const captured: { lookthrough: boolean; uuidCount: number }[] = [];

// Stub the SecurityClient.getByIds(request, callback) RPC. The test
// drives `mockResponseFactory` to control what the helper sees back.
let mockResponseFactory: (request: any) => { getSecurityResponseList(): any[] };

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js', () => ({
  SecurityClient: vi.fn().mockImplementation(() => ({
    getByIds: vi.fn().mockImplementation((request: any, callback: Function) => {
      captured.push({
        lookthrough: request.getLookthrough(),
        uuidCount: request.getUuidsList().length,
      });
      callback(null, mockResponseFactory(request));
    }),
  })),
}));

vi.mock('$lib/grpc-auth', () => ({
  getServiceConnection: vi.fn().mockReturnValue({
    url: 'localhost:80',
    credentials: {},
    interceptors: [],
  }),
}));

import {
  TREASURY_CURVE_INDEX_UUID,
  fetchIndexConstituentUuids,
  fetchSecuritiesByUuids,
} from '$lib/indexLookthrough';
import type { UUIDProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';

function uuidProtoFromString(uuid: string): UUIDProto {
  return new UUID(UUID.fromString(uuid)).toUUIDProto();
}

// Hand-built constituent stub matching the wire shape backend-dev-ledger
// populates on lookthrough: is_link=true, uuid + as_of present, body
// otherwise empty.
function linkConstituent(uuid: string) {
  return {
    getUuid: () => uuidProtoFromString(uuid),
    getIsLink: () => true,
  };
}

function indexResponseProto(constituentUuids: string[]) {
  return {
    getIndexDetails: () => ({
      getConstituentsList: () => constituentUuids.map(linkConstituent),
    }),
  };
}

describe('TREASURY_CURVE_INDEX_UUID', () => {
  test('matches the deterministic uuid5 from market-data-inputs PR #18', () => {
    // Stable across environments — drift would break the loader.
    expect(TREASURY_CURVE_INDEX_UUID).toBe('8a6dba91-832a-501c-8d78-dc887e3acb30');
  });
});

describe('fetchIndexConstituentUuids', () => {
  beforeEach(() => { captured.length = 0; });

  test('issues a single GetByIds with the index UUID and lookthrough=true', async () => {
    mockResponseFactory = () => ({
      getSecurityResponseList: () => [indexResponseProto([
        '00000000-0000-0000-0000-000000000001',
      ])],
    });

    await fetchIndexConstituentUuids(TREASURY_CURVE_INDEX_UUID, new Date('2026-05-13'));

    expect(captured).toHaveLength(1);
    expect(captured[0].lookthrough).toBe(true);
    expect(captured[0].uuidCount).toBe(1);
  });

  test('extracts all constituent UUIDs from IndexDetailsProto.constituents', async () => {
    const expected = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ];
    mockResponseFactory = () => ({
      getSecurityResponseList: () => [indexResponseProto(expected)],
    });

    const got = await fetchIndexConstituentUuids(TREASURY_CURVE_INDEX_UUID, new Date('2026-05-13'));
    expect(got).toEqual(expected);
  });

  test('returns [] when the resolver returned no constituents (no-resolver / sparse asOf)', async () => {
    mockResponseFactory = () => ({ getSecurityResponseList: () => [] });
    const got = await fetchIndexConstituentUuids(TREASURY_CURVE_INDEX_UUID, new Date('2026-05-13'));
    expect(got).toEqual([]);
  });

  test('returns [] when the Security has no IndexDetails (no-op back-compat path)', async () => {
    mockResponseFactory = () => ({
      getSecurityResponseList: () => [
        { getIndexDetails: () => undefined },
      ],
    });
    const got = await fetchIndexConstituentUuids(TREASURY_CURVE_INDEX_UUID, new Date('2026-05-13'));
    expect(got).toEqual([]);
  });
});

describe('fetchSecuritiesByUuids', () => {
  beforeEach(() => { captured.length = 0; });

  test('short-circuits with no RPC call when the UUID list is empty', async () => {
    mockResponseFactory = () => ({ getSecurityResponseList: () => [] });
    const got = await fetchSecuritiesByUuids([], new Date('2026-05-13'));
    expect(got).toEqual([]);
    expect(captured).toHaveLength(0);
  });

  test('issues GetByIds with lookthrough=false and one uuid entry per constituent', async () => {
    mockResponseFactory = () => ({ getSecurityResponseList: () => [] });
    const uuids = ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'];
    await fetchSecuritiesByUuids(uuids, new Date('2026-05-13'));
    expect(captured).toHaveLength(1);
    expect(captured[0].lookthrough).toBe(false);
    expect(captured[0].uuidCount).toBe(2);
  });
});
