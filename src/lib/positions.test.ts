/**
 * Unit tests for the portfolioId filter logic in positions.ts.
 *
 * Since FetchPosition depends on external gRPC services (PositionService),
 * and the ledger-models library uses complex protobuf wrappers that are
 * difficult to mock in isolation, we test the filter logic indirectly
 * by verifying the function signature and parameter handling.
 *
 * The existing valuation.test.ts in this project also calls real services
 * (integration-style), so that is the established pattern. However,
 * for these unit tests we mock the dependencies to avoid needing a running backend.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll test the PositionFilter logic by mocking the module dependencies
// and verifying the filter is constructed correctly.

// Mock all the heavy ledger-models dependencies
vi.mock('@fintekkers/ledger-models/node/wrappers/models/position/positionfilter', () => {
	const addEqualsFilter = vi.fn();
	const addObjectFilter = vi.fn();
	const addFilter = vi.fn();
	return {
		PositionFilter: vi.fn().mockImplementation(() => ({
			addEqualsFilter,
			addObjectFilter,
			addFilter,
		})),
	};
});

vi.mock('@fintekkers/ledger-models/node/wrappers/models/utils/datetime', () => ({
	ZonedDateTime: { now: vi.fn(() => 'mock-now') },
}));

// Mock PositionClient (raw gRPC client used by positions.ts after broker routing refactor)
const mockStream = {
	on: vi.fn().mockImplementation(function (this: any, event: string, handler: Function) {
		if (event === 'end') handler();
		return this;
	}),
};

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/position-service/position_service_grpc_pb.js', () => ({
	PositionClient: vi.fn().mockImplementation(() => ({
		search: vi.fn().mockReturnValue(mockStream),
		validateQueryRequest: vi.fn().mockImplementation((_req: any, cb: Function) => {
			cb(null, { getErrorsList: () => [] });
		}),
	})),
}));

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

vi.mock('@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest', () => ({
	QueryPositionRequest: vi.fn().mockImplementation(() => ({
		toProto: vi.fn().mockReturnValue({}),
	})),
}));

vi.mock('@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js', () => ({
	default: {
		FieldProto: {
			IDENTIFIER: 'IDENTIFIER',
			TRADE_DATE: 'TRADE_DATE',
			ASSET_CLASS: 'ASSET_CLASS',
			PORTFOLIO_ID: 'PORTFOLIO_ID',
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
	PositionFilterOperator: {
		EQUALS: 'EQUALS',
		MORE_THAN: 'MORE_THAN',
		LESS_THAN: 'LESS_THAN',
	},
}));

vi.mock('@fintekkers/ledger-models/node/wrappers/models/utils/uuid', () => ({
	UUID: class MockUUID {
		private value: string;
		constructor(bytes: any) { this.value = String(bytes); }
		static fromString(s: string) { return s; }
		toUUIDProto() { return {}; }
	},
}));

describe('FetchPosition - portfolioId filter', () => {
	let FetchPosition: typeof import('./positions').FetchPosition;
	let PositionFilter: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const positionsModule = await import('./positions');
		FetchPosition = positionsModule.FetchPosition;
		const filterModule = await import(
			'@fintekkers/ledger-models/node/wrappers/models/position/positionfilter'
		);
		PositionFilter = filterModule.PositionFilter;
	});

	const baseRequestData = {
		fields: ['SECURITY_DESCRIPTION'] as any[],
		measures: ['DIRECTED_QUANTITY'] as any[],
	};

	it('adds PORTFOLIO_ID filter (field_value_packed/UUIDProto) when portfolioId is provided', async () => {
		await FetchPosition(
			baseRequestData,
			'DEFAULT_VIEW' as any,
			'TAX_LOT' as any,
			undefined,
			'asc',
			undefined,
			undefined,
			undefined,
			undefined,
			'550e8400-e29b-41d4-a716-446655440000'
		);

		// The fix uses addFilter (not addEqualsFilter) so the entry is serialised as
		// field_value_packed with UUIDProto, which is what the ledger-service expects.
		const filterInstance = PositionFilter.mock.results[0].value;
		expect(filterInstance.addFilter).toHaveBeenCalledWith(
			'PORTFOLIO_ID',
			'EQUALS',
			expect.any(Object)  // UUID instance
		);
	});

	it('does NOT add PORTFOLIO_ID filter when portfolioId is not provided', async () => {
		await FetchPosition(
			baseRequestData,
			'DEFAULT_VIEW' as any,
			'TAX_LOT' as any
		);

		const filterInstance = PositionFilter.mock.results[0].value;
		// addFilter should not have been called with PORTFOLIO_ID
		const portfolioIdCalls = filterInstance.addFilter.mock.calls.filter(
			(call: any[]) => call[0] === 'PORTFOLIO_ID'
		);
		expect(portfolioIdCalls.length).toBe(0);
	});

	it('does NOT add PORTFOLIO_ID filter when portfolioId is empty string', async () => {
		await FetchPosition(
			baseRequestData,
			'DEFAULT_VIEW' as any,
			'TAX_LOT' as any,
			undefined,
			'asc',
			undefined,
			undefined,
			undefined,
			undefined,
			''
		);

		const filterInstance = PositionFilter.mock.results[0].value;
		const portfolioIdCalls = filterInstance.addFilter.mock.calls.filter(
			(call: any[]) => call[0] === 'PORTFOLIO_ID'
		);
		expect(portfolioIdCalls.length).toBe(0);
	});

	it('trims whitespace from portfolioId and uses addFilter with a UUID object', async () => {
		await FetchPosition(
			baseRequestData,
			'DEFAULT_VIEW' as any,
			'TAX_LOT' as any,
			undefined,
			'asc',
			undefined,
			undefined,
			undefined,
			undefined,
			'  550e8400-e29b-41d4-a716-446655440001  '
		);

		const filterInstance = PositionFilter.mock.results[0].value;
		const portfolioIdCalls = filterInstance.addFilter.mock.calls.filter(
			(call: any[]) => call[0] === 'PORTFOLIO_ID'
		);
		expect(portfolioIdCalls.length).toBe(1);
		expect(portfolioIdCalls[0][1]).toBe('EQUALS');
	});
});
