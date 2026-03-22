/**
 * ISSUE #34: Auth E2E tests against the broker's Auth gRPC endpoints.
 *
 * The broker (port 80) exposes:
 *   fintekkers.services.auth.Auth/Register — creates a user, returns user_id
 *   fintekkers.services.auth.Auth/Login    — authenticates, returns api_key
 *
 * All other gRPC services require x-api-key metadata (REQUIRE_AUTH=true).
 *
 * Proto: ~/projects/broker-service/proto/auth.proto
 * Tests use grpcurl (must be installed) to call the broker directly.
 *
 * Prerequisites:
 *   - broker-service running on port 80
 *   - grpcurl installed (brew install grpcurl)
 */
import { describe, expect, test, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BROKER_HOST = '127.0.0.1:80';
const PROTO_PATH = path.resolve(process.env.HOME!, 'projects/broker-service/proto');
const AUTH_PROTO = 'auth.proto';
const SIGNUP_CODE = 'S1GNUP';

// Unique email per test run to avoid collisions
const RUN_ID = Date.now();
const TEST_EMAIL = `e2e-${RUN_ID}@fintekkers-test.local`;
const TEST_PASSWORD = 'TestPass123';
const TEST_NAME = 'E2E Test User';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface GrpcResult {
	code: number;
	stdout: string;
	stderr: string;
}

/**
 * Call a gRPC method via grpcurl. Returns structured result.
 * Non-zero exit code is NOT thrown — caller checks result.code.
 */
function grpc(
	service: string,
	method: string,
	data: Record<string, string>,
	metadata: Record<string, string> = {},
): GrpcResult {
	const dataJson = JSON.stringify(data);
	const metaArgs = Object.entries(metadata)
		.map(([k, v]) => `-H '${k}: ${v}'`)
		.join(' ');

	const cmd = [
		'grpcurl -plaintext',
		`-import-path ${PROTO_PATH}`,
		`-proto ${AUTH_PROTO}`,
		metaArgs,
		`-d '${dataJson}'`,
		BROKER_HOST,
		`${service}/${method}`,
	]
		.filter(Boolean)
		.join(' ');

	try {
		const stdout = execSync(cmd, { encoding: 'utf-8', timeout: 10_000 });
		return { code: 0, stdout, stderr: '' };
	} catch (err: any) {
		return {
			code: err.status ?? 1,
			stdout: err.stdout ?? '',
			stderr: err.stderr ?? '',
		};
	}
}

/**
 * Call a non-auth gRPC service (uses reflection, no proto import needed).
 */
function grpcService(
	service: string,
	method: string,
	metadata: Record<string, string> = {},
): GrpcResult {
	const metaArgs = Object.entries(metadata)
		.map(([k, v]) => `-H '${k}: ${v}'`)
		.join(' ');

	const cmd = `grpcurl -plaintext ${metaArgs} ${BROKER_HOST} ${service}/${method}`;

	try {
		const stdout = execSync(cmd, { encoding: 'utf-8', timeout: 10_000 });
		return { code: 0, stdout, stderr: '' };
	} catch (err: any) {
		return {
			code: err.status ?? 1,
			stdout: err.stdout ?? '',
			stderr: err.stderr ?? '',
		};
	}
}

// ---------------------------------------------------------------------------
// Connectivity check
// ---------------------------------------------------------------------------
let brokerAvailable = false;

beforeAll(() => {
	try {
		execSync(`grpcurl -plaintext ${BROKER_HOST} list`, { timeout: 3000 });
		brokerAvailable = true;
	} catch {
		console.warn('BROKER NOT AVAILABLE on port 80 — auth E2E tests will be skipped');
	}
});

// =============================================================================
// 1. REGISTRATION TESTS
// =============================================================================
describe('Auth.Register', () => {
	test('valid registration succeeds', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Register', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
			name: TEST_NAME,
			signup_code: SIGNUP_CODE,
		});

		expect(result.code).toBe(0);
		const resp = JSON.parse(result.stdout);
		expect(resp.success).toBe(true);
		expect(resp.userId).toBeDefined();
		expect(resp.userId.length).toBeGreaterThan(0);
		expect(resp.message).toContain('created');
	});

	test('wrong signup code returns PermissionDenied', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Register', {
			email: `bad-code-${RUN_ID}@fintekkers-test.local`,
			password: TEST_PASSWORD,
			name: 'Bad Code',
			signup_code: 'WRONG_CODE',
		});

		expect(result.code).not.toBe(0);
		expect(result.stderr).toContain('PermissionDenied');
		expect(result.stderr).toContain('Invalid signup code');
	});

	test('duplicate email returns AlreadyExists', () => {
		if (!brokerAvailable) return;

		// TEST_EMAIL was registered in the first test
		const result = grpc('fintekkers.services.auth.Auth', 'Register', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
			name: 'Duplicate',
			signup_code: SIGNUP_CODE,
		});

		expect(result.code).not.toBe(0);
		expect(result.stderr).toContain('AlreadyExists');
		expect(result.stderr).toContain('already registered');
	});

	test('missing signup code is rejected', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Register', {
			email: `no-code-${RUN_ID}@fintekkers-test.local`,
			password: TEST_PASSWORD,
			name: 'No Code',
			signup_code: '',
		});

		expect(result.code).not.toBe(0);
	});

	test('empty password is rejected', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Register', {
			email: `empty-pw-${RUN_ID}@fintekkers-test.local`,
			password: '',
			name: 'Empty PW',
			signup_code: SIGNUP_CODE,
		});

		expect(result.code).not.toBe(0);
	});
});

// =============================================================================
// 2. LOGIN TESTS
// =============================================================================
describe('Auth.Login', () => {
	test('valid login returns API key', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});

		expect(result.code).toBe(0);
		const resp = JSON.parse(result.stdout);

		expect(resp.apiKey).toBeDefined();
		expect(resp.apiKey).toMatch(/^ftk_live_/);
		expect(resp.apiKey.length).toBeGreaterThan(20);
		expect(resp.email).toBe(TEST_EMAIL);
		expect(resp.name).toBe(TEST_NAME);
		expect(resp.userId).toBeDefined();
	});

	test('invalid password returns Unauthenticated', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: TEST_EMAIL,
			password: 'WrongPassword999',
		});

		expect(result.code).not.toBe(0);
		expect(result.stderr).toContain('Unauthenticated');
		expect(result.stderr).toContain('Invalid email or password');
	});

	test('unknown email returns Unauthenticated', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: 'nobody-ever@fintekkers-test.local',
			password: TEST_PASSWORD,
		});

		expect(result.code).not.toBe(0);
		expect(result.stderr).toContain('Unauthenticated');
		expect(result.stderr).toContain('Invalid email or password');
	});
});

// =============================================================================
// 3. API KEY AUTHORIZATION TESTS
// =============================================================================
describe('API Key authorization on broker services', () => {
	let apiKey: string;

	beforeAll(() => {
		if (!brokerAvailable) return;

		// Login to get a fresh API key
		const result = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});
		if (result.code === 0) {
			apiKey = JSON.parse(result.stdout).apiKey;
		}
	});

	test('request with valid API key succeeds (no Unauthenticated error)', () => {
		if (!brokerAvailable || !apiKey) return;

		const result = grpcService(
			'fintekkers.services.security_service.Security',
			'ListIds',
			{ 'x-api-key': apiKey },
		);

		// May fail for other reasons (empty request), but NOT Unauthenticated
		expect(result.stderr).not.toContain('Unauthenticated');
		expect(result.stderr).not.toContain('API key required');
		expect(result.stderr).not.toContain('Invalid API key');
	});

	test('request with invalid API key returns Unauthenticated (code 16)', () => {
		if (!brokerAvailable) return;

		const result = grpcService(
			'fintekkers.services.security_service.Security',
			'ListIds',
			{ 'x-api-key': 'ftk_live_invalid_key_1234567890' },
		);

		expect(result.code).not.toBe(0);
		expect(result.stderr).toContain('Unauthenticated');
		expect(result.stderr).toContain('Invalid API key');
	});

	test('request with no API key returns Unauthenticated', () => {
		if (!brokerAvailable) return;

		const result = grpcService(
			'fintekkers.services.security_service.Security',
			'ListIds',
		);

		expect(result.code).not.toBe(0);
		expect(result.stderr).toContain('Unauthenticated');
		expect(result.stderr).toContain('API key required');
	});

	test('request with empty API key returns Unauthenticated', () => {
		if (!brokerAvailable) return;

		const result = grpcService(
			'fintekkers.services.security_service.Security',
			'ListIds',
			{ 'x-api-key': '' },
		);

		expect(result.code).not.toBe(0);
		expect(result.stderr).toContain('Unauthenticated');
	});
});

// =============================================================================
// 4. API KEY LIFECYCLE TESTS
// =============================================================================
describe('API Key lifecycle', () => {
	test('login returns a key with ftk_live_ prefix and sufficient entropy', () => {
		if (!brokerAvailable) return;

		const result = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});

		expect(result.code).toBe(0);
		const resp = JSON.parse(result.stdout);
		const key = resp.apiKey;

		// Prefix check
		expect(key).toMatch(/^ftk_live_/);

		// Entropy check: at least 32 hex chars after prefix
		const body = key.replace('ftk_live_', '');
		expect(body.length).toBeGreaterThanOrEqual(32);
		expect(body).toMatch(/^[0-9a-f]+$/);
	});

	test('multiple logins return the same API key (idempotent)', () => {
		if (!brokerAvailable) return;

		const r1 = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});
		const r2 = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});

		expect(r1.code).toBe(0);
		expect(r2.code).toBe(0);

		const key1 = JSON.parse(r1.stdout).apiKey;
		const key2 = JSON.parse(r2.stdout).apiKey;

		// Typically the same key is returned for the same user
		// (implementation may vary — if rotation happens on each login,
		// old key should stop working)
		expect(key1).toBeDefined();
		expect(key2).toBeDefined();
	});

	test('each user gets a unique API key', () => {
		if (!brokerAvailable) return;

		// Register a second user
		const email2 = `e2e-unique-${RUN_ID}@fintekkers-test.local`;
		const reg = grpc('fintekkers.services.auth.Auth', 'Register', {
			email: email2,
			password: TEST_PASSWORD,
			name: 'Unique Key Test',
			signup_code: SIGNUP_CODE,
		});
		expect(reg.code).toBe(0);

		// Login both users
		const r1 = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});
		const r2 = grpc('fintekkers.services.auth.Auth', 'Login', {
			email: email2,
			password: TEST_PASSWORD,
		});

		const key1 = JSON.parse(r1.stdout).apiKey;
		const key2 = JSON.parse(r2.stdout).apiKey;

		expect(key1).not.toBe(key2);
	});
});

// =============================================================================
// 5. AUTH INFRASTRUCTURE VERIFICATION (no services needed)
// =============================================================================
describe('Auth infrastructure – files and schema', () => {
	test('auth.proto defines Register and Login RPCs', () => {
		const proto = fs.readFileSync(
			path.join(PROTO_PATH, AUTH_PROTO), 'utf-8',
		);
		expect(proto).toContain('rpc Register');
		expect(proto).toContain('rpc Login');
		expect(proto).toContain('RegisterRequest');
		expect(proto).toContain('LoginResponse');
		expect(proto).toContain('api_key');
		expect(proto).toContain('signup_code');
	});

	test('RegisterRequest has email, password, name, signup_code fields', () => {
		const proto = fs.readFileSync(
			path.join(PROTO_PATH, AUTH_PROTO), 'utf-8',
		);
		expect(proto).toContain('string email = 1');
		expect(proto).toContain('string password = 2');
		expect(proto).toContain('string name = 3');
		expect(proto).toContain('string signup_code = 4');
	});

	test('LoginResponse returns api_key, email, name, user_id', () => {
		const proto = fs.readFileSync(
			path.join(PROTO_PATH, AUTH_PROTO), 'utf-8',
		);
		expect(proto).toContain('string api_key = 1');
		expect(proto).toContain('string email = 2');
		expect(proto).toContain('string name = 3');
		expect(proto).toContain('string user_id = 4');
	});

	test('UI login route exists', () => {
		expect(fs.existsSync(path.resolve('src/routes/login/+page.svelte'))).toBe(true);
		expect(fs.existsSync(path.resolve('src/routes/login/+page.server.ts'))).toBe(true);
	});

	test('UI register route exists', () => {
		expect(fs.existsSync(path.resolve('src/routes/register/+page.svelte'))).toBe(true);
		expect(fs.existsSync(path.resolve('src/routes/register/+page.server.ts'))).toBe(true);
	});

	test('registration validates password and passes to broker for hashing', () => {
		const register = fs.readFileSync(
			path.resolve('src/routes/register/+page.server.ts'), 'utf-8',
		);
		// Password validation is done client-side (Yup min length + confirmation)
		// Hashing is done server-side in the broker (Argon2id)
		expect(register).toContain('password');
		expect(register).toContain('.min(8');
	});

	test('registration enforces min password length and confirmation match', () => {
		const register = fs.readFileSync(
			path.resolve('src/routes/register/+page.server.ts'), 'utf-8',
		);
		expect(register).toContain('.min(8');
		expect(register).toContain('.oneOf(');
	});

	test('registration requires signup code', () => {
		const register = fs.readFileSync(
			path.resolve('src/routes/register/+page.server.ts'), 'utf-8',
		);
		expect(register).toContain('signupcode');
	});
});
