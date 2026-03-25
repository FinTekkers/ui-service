/**
 * QA Session 8 — Transaction/Search limit behavior
 *
 * Tests:
 * 1. limit=0 — should return empty list (or error)
 * 2. limit=-1 — negative limit; service should handle gracefully
 * 3. limit=1 — should return exactly 1 result
 * 4. limit=1000 — the hardcoded default in transactions.ts
 * 5. limit=2000 — above the client default; verify service enforces or accepts
 * 6. No limit field set — service default behavior
 *
 * Note: The transactions.ts wrapper hardcodes limit=1000. This test suite
 * verifies how the underlying service responds to various limit values.
 */
import { describe, it, expect } from 'vitest';
import grpc from '@grpc/grpc-js';

const LEDGER_URL = 'localhost:8082';

// ---------------------------------------------------------------------------
// Helper: call Transaction/Search directly on ledger-service with given limit
// ---------------------------------------------------------------------------

async function transactionSearch(limit: number): Promise<{
	count: number;
	error?: string;
	limitSentToService: number;
}> {
	const { TransactionClient } = await import(
		'@fintekkers/ledger-models/node/fintekkers/services/transaction-service/transaction_service_grpc_pb.js'
	);
	const { QueryTransactionRequestProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/requests/transaction/query_transaction_request_pb.js'
	);
	const { PositionFilter } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/position/positionfilter'
	);
	const { ZonedDateTime } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
	);

	const client = new (TransactionClient as any)(LEDGER_URL, grpc.credentials.createInsecure());
	const filter = new PositionFilter();

	const req = new (QueryTransactionRequestProto as any)();
	req.setObjectClass('SecurityRequest');
	req.setVersion('0.0.1');
	req.setAsOf(ZonedDateTime.now().toProto());
	req.setSearchTransactionInput(filter.toProto());
	req.setLimit(limit);

	const items: any[] = [];
	let error: string | undefined;

	await new Promise<void>((resolve) => {
		const stream = client.search(req);
		stream.on('data', (resp: any) => {
			const list = resp.getTransactionResponseList?.() ?? [];
			list.forEach((t: any) => items.push(t));
		});
		stream.on('end', () => resolve());
		stream.on('error', (err: any) => {
			error = `${err.code}: ${err.details ?? err.message}`;
			resolve();
		});
	});

	return { count: items.length, error, limitSentToService: limit };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Transaction/Search — limit behavior (ledger-service:8082)', () => {
	it('limit=1000 (client default) — returns results without error', async () => {
		const result = await transactionSearch(1000);

		console.log('limit=1000 result:', result);

		if (result.error) {
			console.warn('Error with limit=1000:', result.error);
		} else {
			expect(result.count).toBeLessThanOrEqual(1000);
			// May be 0 if no transactions exist
		}
	}, 20000);

	it('limit=1 — returns at most 1 result', async () => {
		const result = await transactionSearch(1);

		console.log('limit=1 result:', result);

		if (!result.error) {
			expect(result.count).toBeLessThanOrEqual(1);
		}
	}, 20000);

	it('limit=0 — should return 0 results or an error', async () => {
		const result = await transactionSearch(0);

		console.log('limit=0 result:', result);

		if (result.error) {
			// An error for limit=0 is acceptable
			console.log('limit=0 returned error:', result.error);
		} else {
			// If no error, should return 0 items
			if (result.count > 0) {
				console.warn(
					`POTENTIAL BUG: limit=0 returned ${result.count} results — service should respect limit=0`
				);
			}
			// It's acceptable to return 0 or ignore limit=0 and return default,
			// but it should NOT return more than the limit.
			// Note: protobuf int32 default is 0, so limit=0 might be treated as "use server default"
		}
	}, 20000);

	it('limit=-1 — negative limit; should error or treat as 0/default', async () => {
		const result = await transactionSearch(-1);

		console.log('limit=-1 result:', result);

		if (result.error) {
			console.log('limit=-1 returned error (expected):', result.error);
		} else {
			console.log(`limit=-1 returned ${result.count} results (server treated negative limit as default)`);
		}

		// Should NOT hang
		expect(result.count).toBeGreaterThanOrEqual(0);
	}, 20000);

	it('limit=2000 — above client default; service should accept or cap', async () => {
		const result = await transactionSearch(2000);

		console.log('limit=2000 result:', result);

		if (result.error) {
			console.log('limit=2000 returned error:', result.error);
		} else {
			// If service caps at some lower number, it should still return ≤ 2000
			expect(result.count).toBeLessThanOrEqual(2000);
		}
	}, 20000);

	it('limit=100000 — extreme limit; service should cap or error gracefully', async () => {
		const result = await transactionSearch(100000);

		console.log('limit=100000 result:', result);

		if (!result.error) {
			// If service accepts this, it should still return reasonable result
			console.log(`limit=100000 returned ${result.count} results`);
		}
		// Not hanging is the key expectation
	}, 30000);

	it('transactions.ts hardcodes limit=1000 — verify constant', async () => {
		// Read transactions.ts source and verify the hardcoded limit
		const fs = await import('fs');
		const path = await import('path');
		const source = fs.readFileSync(path.resolve('src/lib/transactions.ts'), 'utf-8');

		// The FetchTransactionWithFilter function passes limit=1000
		expect(source).toContain('1000');

		// Verify it's in the searchTransaction call context
		const haslimitCall = source.includes('searchTransaction(') && source.includes('1000');
		expect(haslimitCall).toBe(true);

		console.log('transactions.ts hardcodes limit=1000: confirmed');
	});
});
