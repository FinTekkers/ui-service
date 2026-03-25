/**
 * QA Session 8 — Broker concurrent panic-inducing requests
 *
 * Tests:
 * 1. 10 concurrent requests to the broker service
 * 2. Intentionally malformed requests mixed with valid ones
 * 3. Verify broker process does not panic (remains responsive after errors)
 * 4. No request should hang indefinitely
 *
 * Extends issue #138 (panics on any downstream error) by testing
 * concurrent/parallel scenarios that may expose race conditions.
 */
import { describe, it, expect } from 'vitest';
import grpc from '@grpc/grpc-js';

const BROKER_HOST = 'localhost:80';
const REQUEST_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Helper: call Security/Search through broker (no API key → UNAUTHENTICATED)
// This is the simplest way to generate a stream of broker error responses.
// ---------------------------------------------------------------------------

async function brokerSecuritySearch(id: number): Promise<{
	id: number;
	outcome: 'ok' | 'error' | 'timeout';
	code?: number | string;
	message?: string;
	itemCount?: number;
}> {
	const { SecurityClient } = await import(
		'@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js'
	);
	const { QuerySecurityRequestProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js'
	);
	const { PositionFilter } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/position/positionfilter'
	);
	const { ZonedDateTime } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
	);

	const client = new (SecurityClient as any)(BROKER_HOST, grpc.credentials.createInsecure());
	const filter = new PositionFilter();
	const req = new (QuerySecurityRequestProto as any)();
	req.setObjectClass('SecurityRequest');
	req.setVersion('0.0.1');
	req.setAsOf(ZonedDateTime.now().toProto());
	req.setSearchSecurityInput(filter.toProto());

	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			resolve({ id, outcome: 'timeout', message: 'Request hung' });
		}, REQUEST_TIMEOUT_MS);

		const items: any[] = [];
		const stream = client.search(req);
		stream.on('data', (resp: any) => {
			items.push(resp);
		});
		stream.on('end', () => {
			clearTimeout(timer);
			resolve({ id, outcome: 'ok', itemCount: items.length });
		});
		stream.on('error', (err: any) => {
			clearTimeout(timer);
			resolve({
				id,
				outcome: 'error',
				code: err.code,
				message: err.details ?? err.message,
			});
		});
	});
}

// ---------------------------------------------------------------------------
// Helper: call valuation service through broker (no API key → UNAUTHENTICATED)
// ---------------------------------------------------------------------------

async function brokerRunValuation(id: number): Promise<{
	id: number;
	outcome: 'ok' | 'error' | 'timeout';
	code?: number | string;
	message?: string;
}> {
	const { ValuationClient } = await import(
		'@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js'
	);
	const { ValuationRequestProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js'
	);
	const { ZonedDateTime } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
	);
	const operationPkg = await import(
		'@fintekkers/ledger-models/node/fintekkers/requests/util/operation_pb.js'
	);
	const { RequestOperationTypeProto } = operationPkg.default as any;

	const client = new (ValuationClient as any)(BROKER_HOST, grpc.credentials.createInsecure());
	const req = new (ValuationRequestProto as any)();
	req.setObjectClass('ValuationRequestProto');
	req.setVersion('0.0.1');
	req.setOperationType(RequestOperationTypeProto.GET);
	req.setAsofDatetime(ZonedDateTime.now().toProto());
	// Intentionally incomplete request (no security, no price) to trigger error path

	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			resolve({ id, outcome: 'timeout', message: 'Request hung' });
		}, REQUEST_TIMEOUT_MS);

		client.runValuation(req, (err: any, resp: any) => {
			clearTimeout(timer);
			if (err) {
				resolve({ id, outcome: 'error', code: err.code, message: err.details ?? err.message });
			} else {
				resolve({ id, outcome: 'ok' });
			}
		});
	});
}

// ---------------------------------------------------------------------------
// Broker health check
// ---------------------------------------------------------------------------

async function isBrokerAlive(): Promise<boolean> {
	// Try a simple connection; if it returns any response within 3s, it's alive
	const result = await brokerSecuritySearch(-1);
	// 'ok' or 'error' both mean the broker is alive; 'timeout' means it's hung/dead
	return result.outcome !== 'timeout';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Broker concurrency — panic resistance', () => {
	it('broker is reachable before test run', async () => {
		const alive = await isBrokerAlive();
		console.log(`Broker alive: ${alive}`);
		expect(alive).toBe(true);
	}, 15000);

	it('10 concurrent unauthenticated requests do not crash the broker', async () => {
		const N = 10;

		// Send 10 concurrent requests
		const promises = Array.from({ length: N }, (_, i) => brokerSecuritySearch(i));
		const results = await Promise.all(promises);

		console.log('Concurrent request results:');
		results.forEach((r) => {
			console.log(`  [${r.id}] outcome=${r.outcome} code=${r.code ?? 'n/a'} msg=${r.message ?? ''}`);
		});

		// No request should timeout (hang indefinitely)
		const timeouts = results.filter((r) => r.outcome === 'timeout');
		expect(timeouts).toHaveLength(0);

		// All requests should return a response (ok or error, not timeout)
		const responded = results.filter((r) => r.outcome !== 'timeout');
		expect(responded).toHaveLength(N);

		// Broker must still be alive after the burst
		const stillAlive = await isBrokerAlive();
		console.log(`Broker alive after 10 concurrent requests: ${stillAlive}`);
		expect(stillAlive).toBe(true);
	}, 60000);

	it('20 concurrent requests with mixed services do not crash broker', async () => {
		const securityRequests = Array.from({ length: 10 }, (_, i) => brokerSecuritySearch(i));
		const valuationRequests = Array.from({ length: 10 }, (_, i) => brokerRunValuation(100 + i));

		const results = await Promise.all([...securityRequests, ...valuationRequests]);

		console.log('Mixed concurrent results:');
		const timeouts = results.filter((r) => r.outcome === 'timeout');
		const errors = results.filter((r) => r.outcome === 'error');
		const ok = results.filter((r) => r.outcome === 'ok');
		console.log(`  ok=${ok.length} errors=${errors.length} timeouts=${timeouts.length}`);

		// No hangs
		expect(timeouts).toHaveLength(0);

		// Log error codes for analysis
		errors.forEach((r) => {
			console.log(`  Error code=${r.code} msg=${r.message}`);
		});

		const stillAlive = await isBrokerAlive();
		expect(stillAlive).toBe(true);
	}, 90000);

	it('50 rapid sequential unauthenticated requests do not crash broker', async () => {
		const N = 50;
		const results: Awaited<ReturnType<typeof brokerSecuritySearch>>[] = [];

		// Sequential to ensure each error goes through the full broker error path
		for (let i = 0; i < N; i++) {
			const r = await brokerSecuritySearch(i);
			results.push(r);
		}

		const timeouts = results.filter((r) => r.outcome === 'timeout');
		console.log(
			`50 sequential requests: ${results.filter((r) => r.outcome === 'ok').length} ok, ` +
			`${results.filter((r) => r.outcome === 'error').length} errors, ` +
			`${timeouts.length} timeouts`
		);

		// No hangs at any point
		expect(timeouts).toHaveLength(0);

		// Broker should still be alive
		const stillAlive = await isBrokerAlive();
		expect(stillAlive).toBe(true);
	}, 120000);

	it('intentionally malformed request (empty ValuationRequest) does not cause panic', async () => {
		const result = await brokerRunValuation(999);

		console.log('Malformed valuation result:', result);

		// Should get an error (UNAUTHENTICATED or INVALID_ARGUMENT), not a timeout
		expect(result.outcome).not.toBe('timeout');

		// Broker still alive
		const stillAlive = await isBrokerAlive();
		expect(stillAlive).toBe(true);
	}, 20000);
});
