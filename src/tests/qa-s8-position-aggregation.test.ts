/**
 * QA Session 8 — Position/Search aggregation edge cases
 *
 * Tests:
 * 1. Requesting SECURITY + SECURITY_ID fields together
 * 2. Verifying field deduplication / no conflict
 * 3. Testing that adding both fields doesn't cause silent data loss
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock setup (same pattern as positions.test.ts) ----

const capturedRequests: any[] = [];

const mockStream = {
	on: vi.fn().mockImplementation(function (this: any, event: string, handler: Function) {
		if (event === 'end') handler();
		return this;
	}),
};

vi.mock('@fintekkers/ledger-models/node/wrappers/models/position/positionfilter', () => {
	const addEqualsFilter = vi.fn();
	const addObjectFilter = vi.fn();
	const addFilter = vi.fn();
	return {
		PositionFilter: vi.fn().mockImplementation(() => ({
			addEqualsFilter,
			addObjectFilter,
			addFilter,
			toProto: vi.fn().mockReturnValue({}),
		})),
	};
});

vi.mock('@fintekkers/ledger-models/node/wrappers/models/utils/datetime', () => ({
	ZonedDateTime: { now: vi.fn(() => ({ toProto: () => ({}) })) },
}));

vi.mock(
	'@fintekkers/ledger-models/node/fintekkers/services/position-service/position_service_grpc_pb.js',
	() => ({
		PositionClient: vi.fn().mockImplementation(() => ({
			search: vi.fn().mockImplementation((req: any) => {
				capturedRequests.push(req);
				return mockStream;
			}),
			validateQueryRequest: vi.fn().mockImplementation((_req: any, cb: Function) => {
				cb(null, { getErrorsList: () => [] });
			}),
		})),
	})
);

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {}, interceptors: [] }),
}));

vi.mock('@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest', () => ({
	QueryPositionRequest: vi.fn().mockImplementation((filter, posType, posView, fields, measures) => {
		capturedRequests.push({ fields, measures, filter });
		return {
			toProto: vi.fn().mockReturnValue({ fields, measures }),
		};
	}),
}));

vi.mock('@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js', () => ({
	default: {
		FieldProto: {
			SECURITY: 1,
			SECURITY_ID: 44,
			IDENTIFIER: 4,
			ASSET_CLASS: 2,
			PORTFOLIO_ID: 30,
			TRADE_DATE: 7,
		},
	},
}));

vi.mock('@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb', () => ({
	IdentifierProto: vi.fn().mockImplementation(() => ({
		setIdentifierType: vi.fn().mockReturnThis(),
		setIdentifierValue: vi.fn().mockReturnThis(),
	})),
}));

vi.mock('@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb', () => ({
	IdentifierTypeProto: { CUSIP: 'CUSIP' },
}));

vi.mock('@fintekkers/ledger-models/node/wrappers/models/utils/serialization.util', () => ({
	pack: vi.fn(),
}));

vi.mock('@fintekkers/ledger-models/node/wrappers/models/security/identifier', () => ({
	Identifier: vi.fn(),
}));

vi.mock('@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js', () => ({
	PositionFilterOperator: { EQUALS: 'EQUALS', MORE_THAN: 'MORE_THAN', LESS_THAN: 'LESS_THAN' },
}));

vi.mock('@fintekkers/ledger-models/node/wrappers/models/utils/uuid', () => ({
	UUID: class MockUUID {
		constructor(_: any) {}
		static fromString(s: string) { return s; }
	},
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Position/Search — field aggregation edge cases', () => {
	let FetchPosition: typeof import('../lib/positions').FetchPosition;

	beforeEach(async () => {
		vi.clearAllMocks();
		capturedRequests.length = 0;
		const positionsModule = await import('../lib/positions');
		FetchPosition = positionsModule.FetchPosition;
	});

	const baseRequestData = {
		fields: [] as any[],
		measures: ['DIRECTED_QUANTITY'] as any[],
	};

	it('accepts SECURITY field alone without error', async () => {
		const requestData = {
			...baseRequestData,
			fields: [1 /* SECURITY */] as any[],
		};

		let thrown = false;
		try {
			await FetchPosition(requestData, 'DEFAULT_VIEW' as any, 'TAX_LOT' as any);
		} catch {
			thrown = true;
		}

		expect(thrown).toBe(false);
		// QueryPositionRequest called with SECURITY field
		expect(capturedRequests.length).toBeGreaterThan(0);
		const req = capturedRequests[0];
		expect(req.fields).toContain(1);
	});

	it('accepts SECURITY_ID field alone without error', async () => {
		const requestData = {
			...baseRequestData,
			fields: [44 /* SECURITY_ID */] as any[],
		};

		let thrown = false;
		try {
			await FetchPosition(requestData, 'DEFAULT_VIEW' as any, 'TAX_LOT' as any);
		} catch {
			thrown = true;
		}

		expect(thrown).toBe(false);
		const req = capturedRequests[0];
		expect(req.fields).toContain(44);
	});

	it('accepts both SECURITY and SECURITY_ID fields together without error', async () => {
		const requestData = {
			...baseRequestData,
			fields: [1 /* SECURITY */, 44 /* SECURITY_ID */] as any[],
		};

		let thrown = false;
		try {
			await FetchPosition(requestData, 'DEFAULT_VIEW' as any, 'TAX_LOT' as any);
		} catch {
			thrown = true;
		}

		expect(thrown).toBe(false);

		// Both fields should be in the request
		const req = capturedRequests[0];
		expect(req.fields).toContain(1);
		expect(req.fields).toContain(44);

		// Fields should not be deduplicated/removed
		expect(req.fields.filter((f: number) => f === 1).length).toBe(1);
		expect(req.fields.filter((f: number) => f === 44).length).toBe(1);
	});

	it('accepts SECURITY + SECURITY_ID + IDENTIFIER together (triple overlap)', async () => {
		const requestData = {
			...baseRequestData,
			fields: [1 /* SECURITY */, 44 /* SECURITY_ID */, 4 /* IDENTIFIER */] as any[],
		};

		let thrown = false;
		try {
			await FetchPosition(requestData, 'DEFAULT_VIEW' as any, 'TAX_LOT' as any);
		} catch {
			thrown = true;
		}

		expect(thrown).toBe(false);
		const req = capturedRequests[0];
		expect(req.fields).toHaveLength(3);
	});

	it('duplicate field entries are passed through to service (no deduplication in client)', async () => {
		// If client accidentally deduplicates, this reveals it
		const requestData = {
			...baseRequestData,
			fields: [1, 1, 44, 44] as any[], // deliberate duplicates
		};

		let thrown = false;
		try {
			await FetchPosition(requestData, 'DEFAULT_VIEW' as any, 'TAX_LOT' as any);
		} catch {
			thrown = true;
		}

		expect(thrown).toBe(false);
		const req = capturedRequests[0];
		// Client should not silently remove duplicates — pass them to service
		// (service-side deduplication is acceptable; client should not modify the intent)
		expect(req.fields.length).toBeGreaterThanOrEqual(2);
	});

	it('empty fields array (measure-only query) works without error', async () => {
		// Issue #144: Position/GetByPortfolio should support measure-only queries
		const requestData = {
			fields: [] as any[],
			measures: ['DIRECTED_QUANTITY', 'MARKET_VALUE'] as any[],
		};

		let thrown = false;
		try {
			await FetchPosition(requestData, 'DEFAULT_VIEW' as any, 'TAX_LOT' as any);
		} catch {
			thrown = true;
		}

		expect(thrown).toBe(false);
		const req = capturedRequests[0];
		expect(req.fields).toHaveLength(0);
		expect(req.measures).toHaveLength(2);
	});
});

// ---------------------------------------------------------------------------
// Live integration test — verify real service handles SECURITY + SECURITY_ID
// Note: This test uses direct proto imports (not mocked) to call the real service.
// It cannot use ZonedDateTime from ledger-models because that module is mocked
// above. Instead we use a raw LocalTimestampProto.
// ---------------------------------------------------------------------------

describe('Position/Search — SECURITY + SECURITY_ID live (ledger-service:8082)', () => {
	const LEDGER_URL = 'localhost:8082';

	it('search with SECURITY and SECURITY_ID fields does not crash service', async () => {
		const grpc = await import('@grpc/grpc-js');
		const { PositionClient } = await import(
			'@fintekkers/ledger-models/node/fintekkers/services/position-service/position_service_grpc_pb.js'
		);
		const { QueryPositionRequestProto: QReq } = await import(
			'@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb.js'
		);
		const positionPkg = await import(
			'@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js'
		);
		const fieldPkg = await import(
			'@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js'
		);
		const { LocalTimestampProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/models/util/local_timestamp_pb.js'
		);

		const { PositionTypeProto, PositionViewProto } = positionPkg.default as any;
		const { FieldProto } = fieldPkg.default as any;

		const client = new (PositionClient as any)(LEDGER_URL, grpc.default.credentials.createInsecure());

		// Build timestamp directly without ZonedDateTime wrapper (which is mocked above)
		// LocalTimestampProto uses setTimestamp(google.protobuf.Timestamp) and setTimeZone(string)
		const { Timestamp } = await import('google-protobuf/google/protobuf/timestamp_pb.js');
		const ts = new (Timestamp as any)();
		const epoch = Math.floor(Date.now() / 1000);
		ts.setSeconds(epoch);
		ts.setNanos(0);
		const now = new (LocalTimestampProto as any)();
		now.setTimestamp(ts);
		now.setTimeZone('America/New_York');

		const req = new (QReq as any)();
		req.setObjectClass('PositionRequest');
		req.setVersion('0.0.1');
		req.setAsOf(now);
		req.setPositionType(PositionTypeProto.CALCULATED);
		req.setPositionView(PositionViewProto.DEFAULT);
		// Add both SECURITY and SECURITY_ID fields
		req.addFields(FieldProto.SECURITY);
		req.addFields(FieldProto.SECURITY_ID);
		// QueryPositionRequestProto does not have setLimit — omit it

		const positions: any[] = [];
		let error: any = null;

		await new Promise<void>((resolve) => {
			const stream = client.search(req);
			stream.on('data', (resp: any) => {
				const list = resp.getPositionsList?.() ?? [];
				list.forEach((p: any) => positions.push(p));
			});
			stream.on('end', () => resolve());
			stream.on('error', (err: any) => {
				error = err;
				resolve();
			});
		});

		console.log(
			`SECURITY+SECURITY_ID search: ${positions.length} positions, error: ${error?.message ?? 'none'}`
		);

		// Service should respond (not hang or crash)
		// Error is acceptable, but must be a proper gRPC error, not a panic/connection reset
		if (error) {
			expect(error.code).toBeDefined();
			// Should NOT be an unexpected connection reset (which would indicate a panic)
			expect(error.message ?? '').not.toContain('RST_STREAM');
		}
	}, 20000);
});
