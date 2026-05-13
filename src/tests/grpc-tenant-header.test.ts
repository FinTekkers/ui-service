/**
 * #267 Phase 1 — tenant header on every outbound gRPC request.
 *
 * The interceptor in $lib/grpc-auth is the choke point: every
 * +page.server.ts that fetches data builds its client via
 * `getServiceConnection(apiKey)`, and the auth flow (register/login)
 * uses the cached `authClient`. Both must inject `x-fintekkers-tenant`
 * on every call, with value from `FINTEKKERS_TENANT` env (default
 * `production`).
 *
 * Strategy: drive the interceptor's `start(metadata, listener, next)`
 * directly with a stub metadata + nextCall. Asserts on the header that
 * lands in the metadata after the interceptor runs.
 *
 * @vitest-environment node
 */
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import grpc from '@grpc/grpc-js';

import {
  getTenantInterceptor,
  getTenantHeaderValue,
  getServiceConnection,
} from '$lib/grpc-auth';

function runInterceptor(interceptor: grpc.Interceptor): grpc.Metadata {
  // Stub the inner call — grpc-js's InterceptingCall routes the
  // requester's `next(metadata, listener)` callback into
  // `this.nextCall.start(metadata, listener)`, so the inner call must
  // have `start` defined. The `InterceptingCallInterface` type isn't
  // publicly re-exported so we cast through `any` rather than name it.
  const opts = {} as grpc.InterceptorOptions;
  let capturedMetadata: grpc.Metadata | undefined;
  const fakeInnerCall = {
    cancelWithStatus: vi.fn(),
    getPeer: () => 'fake-peer',
    start: (md: grpc.Metadata) => { capturedMetadata = md; },
    sendMessageWithContext: vi.fn(),
    sendMessage: vi.fn(),
    startRead: vi.fn(),
    halfClose: vi.fn(),
  } as any;

  const nextCall = vi.fn(() => fakeInnerCall);
  const intercepting = interceptor(opts, nextCall as any);
  const metadata = new grpc.Metadata();
  const listener = {} as any;
  intercepting.start(metadata, listener);
  expect(capturedMetadata, 'interceptor must forward metadata to next call').toBe(metadata);
  return metadata;
}

describe('tenant header — getTenantHeaderValue', () => {
  const originalEnv = process.env.FINTEKKERS_TENANT;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.FINTEKKERS_TENANT;
    else process.env.FINTEKKERS_TENANT = originalEnv;
  });

  test('defaults to "production" when env var is unset', () => {
    delete process.env.FINTEKKERS_TENANT;
    expect(getTenantHeaderValue()).toBe('production');
  });

  test('reads from FINTEKKERS_TENANT env var when set', () => {
    process.env.FINTEKKERS_TENANT = 'test';
    expect(getTenantHeaderValue()).toBe('test');
  });

  test('reads the env at call time, not at module-load (test stubs work)', () => {
    process.env.FINTEKKERS_TENANT = 'canary-1';
    expect(getTenantHeaderValue()).toBe('canary-1');
    process.env.FINTEKKERS_TENANT = 'canary-2';
    expect(getTenantHeaderValue()).toBe('canary-2');
  });
});

describe('tenant header — getTenantInterceptor', () => {
  const originalEnv = process.env.FINTEKKERS_TENANT;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.FINTEKKERS_TENANT;
    else process.env.FINTEKKERS_TENANT = originalEnv;
  });

  test('adds x-fintekkers-tenant=production by default', () => {
    delete process.env.FINTEKKERS_TENANT;
    const md = runInterceptor(getTenantInterceptor());
    expect(md.get('x-fintekkers-tenant')).toEqual(['production']);
  });

  test('adds x-fintekkers-tenant=<override> when env is set', () => {
    process.env.FINTEKKERS_TENANT = 'test';
    const md = runInterceptor(getTenantInterceptor());
    expect(md.get('x-fintekkers-tenant')).toEqual(['test']);
  });

  test('header is set on every call (no caching of the env-resolved value)', () => {
    process.env.FINTEKKERS_TENANT = 'first';
    const interceptor = getTenantInterceptor();
    expect(runInterceptor(interceptor).get('x-fintekkers-tenant')).toEqual(['first']);
    process.env.FINTEKKERS_TENANT = 'second';
    expect(runInterceptor(interceptor).get('x-fintekkers-tenant')).toEqual(['second']);
  });
});

describe('tenant header — getServiceConnection includes the tenant interceptor', () => {
  const originalEnv = process.env.FINTEKKERS_TENANT;

  beforeEach(() => {
    process.env.FINTEKKERS_TENANT = 'test';
  });
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.FINTEKKERS_TENANT;
    else process.env.FINTEKKERS_TENANT = originalEnv;
  });

  test('authenticated connection sends BOTH tenant and api-key headers', () => {
    const conn = getServiceConnection('ftk_live_abc123');
    expect(conn.interceptors.length).toBe(2);

    const tenantMd = runInterceptor(conn.interceptors[0]);
    expect(tenantMd.get('x-fintekkers-tenant')).toEqual(['test']);
    expect(tenantMd.get('x-api-key')).toEqual([]);

    const authMd = runInterceptor(conn.interceptors[1]);
    expect(authMd.get('x-api-key')).toEqual(['ftk_live_abc123']);
    expect(authMd.get('x-fintekkers-tenant')).toEqual([]);
  });

  test('unauthenticated connection still sends the tenant header', () => {
    const conn = getServiceConnection();
    expect(conn.interceptors.length).toBe(1);
    const md = runInterceptor(conn.interceptors[0]);
    expect(md.get('x-fintekkers-tenant')).toEqual(['test']);
  });
});
