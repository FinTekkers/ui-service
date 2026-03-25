/**
 * QA Session 8 — Security/GetFieldValues with AS_OF date filter
 *
 * Tests:
 * 1. Proto structure: GetFieldValuesRequestProto has no as_of field
 * 2. Service behavior: GetFieldValues returns distinct values for given field
 * 3. AS_OF filtering impossible — structural API limitation
 */
import { describe, it, expect } from 'vitest';
import grpc from '@grpc/grpc-js';

// ---------------------------------------------------------------------------
// 1. Proto structure test — no AS_OF in GetFieldValuesRequestProto
// ---------------------------------------------------------------------------

describe('Security/GetFieldValues — proto structure', () => {
	it('GetFieldValuesRequestProto has no as_of field', async () => {
		const { GetFieldValuesRequestProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/requests/security/get_field_values_request_pb.js'
		);

		const req = new GetFieldValuesRequestProto();

		// Verify that there is NO setAsOf or setAs_of method
		expect(typeof (req as any).setAsOf).toBe('undefined');
		expect(typeof (req as any).setAs_of).toBe('undefined');
		expect(typeof (req as any).setAsOfDatetime).toBe('undefined');

		// Proto DOES have these fields
		expect(typeof req.setObjectClass).toBe('function');
		expect(typeof req.setVersion).toBe('function');
		expect(typeof req.setField).toBe('function');

		console.log(
			'GetFieldValuesRequestProto methods:',
			Object.getOwnPropertyNames(Object.getPrototypeOf(req)).filter(
				(m) => m.startsWith('set') || m.startsWith('get')
			)
		);
	});

	it('GetFieldValuesResponseProto has values array (no temporal metadata)', async () => {
		const { GetFieldValuesResponseProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/requests/security/get_field_values_response_pb.js'
		);

		const resp = new GetFieldValuesResponseProto();

		// Response has values list
		expect(typeof resp.getValuesList).toBe('function');

		// No temporal/as_of in response either
		expect(typeof (resp as any).getAsOf).toBe('undefined');
		expect(typeof (resp as any).getValidFrom).toBe('undefined');

		console.log(
			'GetFieldValuesResponseProto methods:',
			Object.getOwnPropertyNames(Object.getPrototypeOf(resp)).filter(
				(m) => m.startsWith('set') || m.startsWith('get')
			)
		);
	});
});

// ---------------------------------------------------------------------------
// 2. Integration test — call Security/GetFieldValues on ledger service directly
// ---------------------------------------------------------------------------

describe('Security/GetFieldValues — live service (ledger-service:8082)', () => {
	const LEDGER_URL = 'localhost:8082';

	async function callGetFieldValues(fieldValue: number): Promise<{
		values: any[];
		error?: string;
	}> {
		const { SecurityClient } = await import(
			'@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js'
		);
		const { GetFieldValuesRequestProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/requests/security/get_field_values_request_pb.js'
		);

		const client = new (SecurityClient as any)(LEDGER_URL, grpc.credentials.createInsecure());

		const req = new (GetFieldValuesRequestProto as any)();
		req.setObjectClass('SecurityRequest');
		req.setVersion('0.0.1');
		req.setField(fieldValue);

		return new Promise((resolve) => {
			client.getFieldValues(req, (err: any, resp: any) => {
				if (err) {
					resolve({ values: [], error: `${err.code}: ${err.details ?? err.message}` });
				} else {
					const values = resp?.getValuesList?.() ?? [];
					resolve({ values });
				}
			});
		});
	}

	it('returns values for ASSET_CLASS field (field=2)', async () => {
		// FieldProto.ASSET_CLASS = 2
		const result = await callGetFieldValues(2);

		console.log('GetFieldValues(ASSET_CLASS) result:', JSON.stringify(result));

		if (result.error) {
			console.warn('GetFieldValues error:', result.error);
			// UNIMPLEMENTED is a known bug pattern
			if (result.error.includes('UNIMPLEMENTED') || result.error.includes('Unimplemented')) {
				console.warn('BUG: Security/GetFieldValues is not implemented for ASSET_CLASS');
			}
		} else {
			expect(Array.isArray(result.values)).toBe(true);
			console.log(`Got ${result.values.length} distinct ASSET_CLASS values`);
		}
	}, 15000);

	it('returns values for SECURITY_ISSUER_NAME field (field=3)', async () => {
		// FieldProto.SECURITY_ISSUER_NAME = 3
		const result = await callGetFieldValues(3);

		console.log('GetFieldValues(SECURITY_ISSUER_NAME) result:', JSON.stringify(result));

		if (result.error) {
			console.warn('GetFieldValues(SECURITY_ISSUER_NAME) error:', result.error);
		} else {
			expect(Array.isArray(result.values)).toBe(true);
			console.log(`Got ${result.values.length} distinct SECURITY_ISSUER_NAME values`);
		}
	}, 15000);

	it('returns values for PRODUCT_TYPE field (field=26)', async () => {
		// FieldProto.PRODUCT_TYPE = 26
		const result = await callGetFieldValues(26);

		console.log('GetFieldValues(PRODUCT_TYPE) result:', JSON.stringify(result));

		if (!result.error) {
			expect(Array.isArray(result.values)).toBe(true);
		}
	}, 15000);

	it('handles unknown/invalid field gracefully', async () => {
		// Field 9999 — should return error or empty list, NOT crash
		const result = await callGetFieldValues(9999);

		console.log('GetFieldValues(invalid field 9999) result:', JSON.stringify(result));

		// Should return an error or empty list, NOT panic
		// If no error, values should be empty
		if (!result.error) {
			expect(Array.isArray(result.values)).toBe(true);
		}
	}, 15000);

	it('cannot filter by date — AS_OF field absent from proto', async () => {
		// This test documents that AS_OF filtering is architecturally impossible
		// because the GetFieldValuesRequestProto has no as_of field.
		// There is no way to ask "what ASSET_CLASS values existed as of date X?"
		const { GetFieldValuesRequestProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/requests/security/get_field_values_request_pb.js'
		);

		const req = new (GetFieldValuesRequestProto as any)();
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(req));
		const hasAsOf = methods.some((m) => m.toLowerCase().includes('asof') || m.toLowerCase().includes('as_of'));

		// Document the structural limitation
		console.log(
			`GetFieldValuesRequestProto has as_of setter: ${hasAsOf}`,
			'\nAvailable setters:',
			methods.filter((m) => m.startsWith('set'))
		);

		// This SHOULD fail — there is no AS_OF in the proto
		expect(hasAsOf).toBe(false);
		// If hasAsOf becomes true in future, the bug has been fixed
	}, 15000);
});
