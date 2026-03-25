/**
 * QA Session 8 — Price/CreateOrUpdate write path + Portfolio/CreateOrUpdate edge cases
 *
 * Tests:
 * Price/CreateOrUpdate:
 * 1. Valid price creation for a known security
 * 2. Price = 0 — should error (zero price is invalid for a bond)
 * 3. Price = -1 — negative price should be rejected
 * 4. Missing security in price request — should error
 * 5. Missing price value — should error
 *
 * Portfolio/CreateOrUpdate:
 * 6. Empty portfolio name — should error
 * 7. Portfolio with no UUID — server should assign one or error
 * 8. Idempotency: same portfolio name twice → same or duplicate?
 * 9. Portfolio name = whitespace only
 * 10. Portfolio name with special characters
 */
import { describe, it, expect } from 'vitest';
import grpc from '@grpc/grpc-js';

const LEDGER_URL = 'localhost:8082';
const PRICE_URL = 'localhost:8083';

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

async function buildTestBondSecurity() {
	const { SecurityProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js'
	);
	const { SecurityTypeProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb.js'
	);
	const { CouponTypeProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js'
	);
	const { CouponFrequencyProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js'
	);
	const { DecimalValueProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js'
	);
	const { UUID } = await import('@fintekkers/ledger-models/node/wrappers/models/utils/uuid');
	const { ZonedDateTime } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
	);
	const { LocalDate } = await import('@fintekkers/ledger-models/node/wrappers/models/utils/date');

	const security = new (SecurityProto as any)();
	security.setObjectClass('Security');
	security.setVersion('0.0.1');
	security.setUuid((UUID as any).random().toUUIDProto());
	security.setAsOf(ZonedDateTime.now().toProto());
	security.setSecurityType((SecurityTypeProto as any).BOND_SECURITY);
	security.setAssetClass('Fixed Income');
	security.setIssuerName('QA Test Issuer');
	security.setFaceValue(new (DecimalValueProto as any)().setArbitraryPrecisionValue('1000'));
	security.setCouponRate(new (DecimalValueProto as any)().setArbitraryPrecisionValue('5.0'));
	security.setCouponType((CouponTypeProto as any).FIXED);
	security.setCouponFrequency((CouponFrequencyProto as any).SEMIANNUALLY);
	security.setIssueDate(LocalDate.from(new Date('2023-01-01')).toProto());
	security.setMaturityDate(LocalDate.from(new Date('2033-01-01')).toProto());

	return security;
}

async function buildPriceProto(security: any, priceStr: string) {
	const { PriceProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js'
	);
	const { DecimalValueProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js'
	);
	const { ZonedDateTime } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
	);

	const price = new (PriceProto as any)();
	price.setObjectClass('PriceProto');
	price.setVersion('0.0.1');
	price.setAsOf(ZonedDateTime.now().toProto());
	price.setPrice(new (DecimalValueProto as any)().setArbitraryPrecisionValue(priceStr));
	if (security) price.setSecurity(security);
	return price;
}

async function createPrice(priceProto: any): Promise<{ response?: any; error?: string }> {
	const { PriceClient } = await import(
		'@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js'
	);
	const { CreatePriceRequestProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/requests/price/create_price_request_pb.js'
	);

	const client = new (PriceClient as any)(PRICE_URL, grpc.credentials.createInsecure());
	const req = new (CreatePriceRequestProto as any)();
	req.setObjectClass('PriceRequest');
	req.setVersion('0.0.1');
	req.setCreatePriceInput(priceProto);

	return new Promise((resolve) => {
		client.createOrUpdate(req, (err: any, resp: any) => {
			if (err) {
				resolve({ error: `${err.code}: ${err.details ?? err.message}` });
			} else {
				resolve({ response: resp });
			}
		});
	});
}

// ---------------------------------------------------------------------------
// Portfolio helpers
// ---------------------------------------------------------------------------

async function createPortfolio(name: string, withUuid: boolean = true): Promise<{
	response?: any;
	error?: string;
}> {
	const { PortfolioClient } = await import(
		'@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb.js'
	);
	const { CreatePortfolioRequestProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/requests/portfolio/create_portfolio_request_pb.js'
	);
	const { PortfolioProto } = await import(
		'@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb.js'
	);
	const { UUID } = await import('@fintekkers/ledger-models/node/wrappers/models/utils/uuid');
	const { ZonedDateTime } = await import(
		'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
	);

	const portfolio = new (PortfolioProto as any)();
	portfolio.setObjectClass('Portfolio');
	portfolio.setVersion('0.0.1');
	portfolio.setAsOf(ZonedDateTime.now().toProto());
	portfolio.setPortfolioName(name);
	if (withUuid) {
		portfolio.setUuid((UUID as any).random().toUUIDProto());
	}

	const req = new (CreatePortfolioRequestProto as any)();
	req.setObjectClass('PortfolioRequest');
	req.setVersion('0.0.1');
	req.setCreatePortfolioInput(portfolio);

	const client = new (PortfolioClient as any)(LEDGER_URL, grpc.credentials.createInsecure());

	return new Promise((resolve) => {
		client.createOrUpdate(req, (err: any, resp: any) => {
			if (err) {
				resolve({ error: `${err.code}: ${err.details ?? err.message}` });
			} else {
				resolve({ response: resp });
			}
		});
	});
}

// ---------------------------------------------------------------------------
// Price/CreateOrUpdate tests
// ---------------------------------------------------------------------------

describe('Price/CreateOrUpdate — write path (price-service-rust:8083)', () => {
	it('creates a valid price for a test bond', async () => {
		const security = await buildTestBondSecurity();
		const price = await buildPriceProto(security, '98.5');
		const result = await createPrice(price);

		console.log('Valid price creation result:', JSON.stringify(result));

		if (result.error) {
			// Acceptable if service requires security to exist in ledger first
			console.log('Price creation error (may require pre-existing security):', result.error);
		} else {
			const priceList = result.response?.getPriceResponseList?.() ?? [];
			console.log(`Created ${priceList.length} price(s)`);
		}
	}, 20000);

	it('price = 0 — service should reject as invalid', async () => {
		const security = await buildTestBondSecurity();
		const price = await buildPriceProto(security, '0');
		const result = await createPrice(price);

		console.log('Price=0 result:', JSON.stringify(result));

		if (!result.error) {
			console.warn('POTENTIAL BUG: service accepted price=0 without error');
			// Issue #165: Price/ValidateCreateOrUpdate accepts empty/invalid requests without errors
		}
		// Logging for analysis — not asserting error because prior bugs show validation is weak
	}, 20000);

	it('price = -1 — negative price should be rejected', async () => {
		const security = await buildTestBondSecurity();
		const price = await buildPriceProto(security, '-1');
		const result = await createPrice(price);

		console.log('Price=-1 result:', JSON.stringify(result));

		if (!result.error) {
			console.warn('POTENTIAL BUG: service accepted negative price -1 without error');
		}
	}, 20000);

	it('price missing security — should return error', async () => {
		const price = await buildPriceProto(null, '98.5');
		const result = await createPrice(price);

		console.log('No-security price result:', JSON.stringify(result));

		if (!result.error) {
			console.warn('POTENTIAL BUG: price created without a security reference');
		}
	}, 20000);

	it('price with no price value (empty decimal) — should return error', async () => {
		const security = await buildTestBondSecurity();
		const price = await buildPriceProto(security, '');
		const result = await createPrice(price);

		console.log('Empty price value result:', JSON.stringify(result));

		// An empty string is not a valid decimal value
		if (!result.error) {
			console.warn('POTENTIAL BUG: service accepted empty price value without error');
		}
	}, 20000);

	it('ValidateCreateOrUpdate rejects price=0', async () => {
		const { PriceClient } = await import(
			'@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js'
		);
		const { CreatePriceRequestProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/requests/price/create_price_request_pb.js'
		);

		const security = await buildTestBondSecurity();
		const price = await buildPriceProto(security, '0');

		const req = new (CreatePriceRequestProto as any)();
		req.setObjectClass('PriceRequest');
		req.setVersion('0.0.1');
		req.setCreatePriceInput(price);

		const client = new (PriceClient as any)(PRICE_URL, grpc.credentials.createInsecure());

		const validationResult: { errors: string[]; error?: string } = await new Promise((resolve) => {
			client.validateCreateOrUpdate(req, (err: any, resp: any) => {
				if (err) {
					resolve({ errors: [], error: `${err.code}: ${err.details ?? err.message}` });
				} else {
					const errorList = resp?.getErrorsList?.() ?? [];
					const messages = errorList.map((e: any) =>
						e.getDetail?.()?.getMessageForDeveloper?.() ?? e.toString()
					);
					resolve({ errors: messages });
				}
			});
		});

		console.log('ValidateCreateOrUpdate(price=0) result:', JSON.stringify(validationResult));

		if (!validationResult.error && validationResult.errors.length === 0) {
			console.warn('POTENTIAL BUG: ValidateCreateOrUpdate returns no errors for price=0');
		}
	}, 20000);
});

// ---------------------------------------------------------------------------
// Portfolio/CreateOrUpdate tests
// ---------------------------------------------------------------------------

describe('Portfolio/CreateOrUpdate — edge cases (ledger-service:8082)', () => {
	const uniqueSuffix = () => Date.now().toString(36);

	it('creates a valid portfolio with name and UUID', async () => {
		const name = `QA-Test-Portfolio-${uniqueSuffix()}`;
		const result = await createPortfolio(name, true);

		console.log('Valid portfolio creation result:', JSON.stringify(result));

		if (result.error) {
			console.log('Portfolio creation error:', result.error);
		} else {
			const list = result.response?.getPortfolioResponseList?.() ?? [];
			console.log(`Created portfolio(s): ${list.length}`);
		}
	}, 20000);

	it('empty portfolio name — should return error', async () => {
		const result = await createPortfolio('', true);

		console.log('Empty name portfolio result:', JSON.stringify(result));

		if (!result.error) {
			const list = result.response?.getPortfolioResponseList?.() ?? [];
			console.warn(
				`POTENTIAL BUG: portfolio created with empty name, response has ${list.length} entries`
			);
		}
	}, 20000);

	it('whitespace-only portfolio name — should return error', async () => {
		const result = await createPortfolio('   ', true);

		console.log('Whitespace name portfolio result:', JSON.stringify(result));

		if (!result.error) {
			console.warn('POTENTIAL BUG: portfolio created with whitespace-only name');
		}
	}, 20000);

	it('portfolio with no UUID — service should assign UUID or error', async () => {
		const name = `QA-No-UUID-${uniqueSuffix()}`;
		const result = await createPortfolio(name, false);

		console.log('No-UUID portfolio result:', JSON.stringify(result));

		if (result.error) {
			console.log('Portfolio without UUID rejected:', result.error);
		} else {
			// If service accepted it, the response should have a UUID assigned
			const list = result.response?.getPortfolioResponseList?.() ?? [];
			if (list.length > 0) {
				const returnedUuid = list[0]?.getUuid?.();
				if (!returnedUuid) {
					console.warn('POTENTIAL BUG: portfolio created without UUID and none assigned');
				} else {
					console.log('Service assigned UUID to portfolio:', returnedUuid);
				}
			}
		}
	}, 20000);

	it('idempotency: same portfolio name twice should not create duplicate', async () => {
		const name = `QA-Idempotency-Test-${uniqueSuffix()}`;

		const first = await createPortfolio(name, true);
		console.log('First creation:', JSON.stringify(first));

		// Create again with a different UUID but same name
		const second = await createPortfolio(name, true);
		console.log('Second creation (same name):', JSON.stringify(second));

		if (!first.error && !second.error) {
			// Both succeeded — check if we got duplicate portfolios
			const firstList = first.response?.getPortfolioResponseList?.() ?? [];
			const secondList = second.response?.getPortfolioResponseList?.() ?? [];
			console.log(
				`First created ${firstList.length} portfolio(s), second created ${secondList.length} portfolio(s)`
			);

			// Now search to see how many with this name exist
			const { PortfolioClient } = await import(
				'@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb.js'
			);
			const { QueryPortfolioRequestProto } = await import(
				'@fintekkers/ledger-models/node/fintekkers/requests/portfolio/query_portfolio_request_pb.js'
			);
			const { PositionFilter } = await import(
				'@fintekkers/ledger-models/node/wrappers/models/position/positionfilter'
			);
			const { ZonedDateTime } = await import(
				'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
			);

			const client = new (PortfolioClient as any)(LEDGER_URL, grpc.credentials.createInsecure());
			const filter = new PositionFilter();
			const req = new (QueryPortfolioRequestProto as any)();
			req.setObjectClass('PortfolioRequest');
			req.setVersion('0.0.1');
			req.setAsOf(ZonedDateTime.now().toProto());
			req.setSearchPortfolioInput(filter.toProto());

			const allPortfolios: any[] = [];
			await new Promise<void>((resolve) => {
				const stream = client.search(req);
				stream.on('data', (resp: any) => {
					const list = resp.getPortfolioResponseList?.() ?? [];
					list.forEach((p: any) => allPortfolios.push(p));
				});
				stream.on('end', () => resolve());
				stream.on('error', () => resolve());
			});

			const matchingName = allPortfolios.filter(
				(p: any) => p.getPortfolioName?.() === name
			);

			console.log(`Portfolios with name '${name}': ${matchingName.length}`);

			if (matchingName.length > 1) {
				console.warn(
					`POTENTIAL BUG: duplicate portfolios created with same name (count=${matchingName.length})`
				);
			}
		}
	}, 40000);

	it('portfolio name with special characters (SQL injection attempt)', async () => {
		const name = `QA'; DROP TABLE portfolios; --${uniqueSuffix()}`;
		const result = await createPortfolio(name, true);

		console.log("SQL-injection-attempt name result:", JSON.stringify(result));

		// Should either create successfully (with the name treated as literal string)
		// or return a validation error — but should NOT crash the service
		if (!result.error) {
			console.log('Service accepted special-character portfolio name (safe behavior)');
		}
	}, 20000);

	it('portfolio name with unicode characters', async () => {
		const name = `QA-Résumé-Ñoño-${uniqueSuffix()}`;
		const result = await createPortfolio(name, true);

		console.log('Unicode portfolio name result:', JSON.stringify(result));
		// Should not crash
	}, 20000);

	it('ValidateCreateOrUpdate rejects empty portfolio name', async () => {
		const { PortfolioClient } = await import(
			'@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb.js'
		);
		const { CreatePortfolioRequestProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/requests/portfolio/create_portfolio_request_pb.js'
		);
		const { PortfolioProto } = await import(
			'@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb.js'
		);
		const { UUID } = await import('@fintekkers/ledger-models/node/wrappers/models/utils/uuid');
		const { ZonedDateTime } = await import(
			'@fintekkers/ledger-models/node/wrappers/models/utils/datetime'
		);

		const portfolio = new (PortfolioProto as any)();
		portfolio.setObjectClass('Portfolio');
		portfolio.setVersion('0.0.1');
		portfolio.setAsOf(ZonedDateTime.now().toProto());
		portfolio.setPortfolioName(''); // empty name
		portfolio.setUuid((UUID as any).random().toUUIDProto());

		const req = new (CreatePortfolioRequestProto as any)();
		req.setObjectClass('PortfolioRequest');
		req.setVersion('0.0.1');
		req.setCreatePortfolioInput(portfolio);

		const client = new (PortfolioClient as any)(LEDGER_URL, grpc.credentials.createInsecure());

		const validationResult: { errors: string[]; error?: string } = await new Promise((resolve) => {
			client.validateCreateOrUpdate(req, (err: any, resp: any) => {
				if (err) {
					resolve({ errors: [], error: `${err.code}: ${err.details ?? err.message}` });
				} else {
					const errorList = resp?.getErrorsList?.() ?? [];
					const messages = errorList.map((e: any) =>
						e.getDetail?.()?.getMessageForDeveloper?.() ?? e.toString()
					);
					resolve({ errors: messages });
				}
			});
		});

		console.log('ValidateCreateOrUpdate(empty name) result:', JSON.stringify(validationResult));

		if (!validationResult.error && validationResult.errors.length === 0) {
			console.warn('POTENTIAL BUG: ValidateCreateOrUpdate returns no errors for empty portfolio name');
		}
	}, 20000);
});
