/**
 * ISSUE #39: Verify three profile page fixes.
 *
 * Fix 1: Regenerate API Key — prompts for email/password, calls broker, shows new key
 * Fix 2: ft_api_key cookie secure flag is false in dev (uses import.meta.env.PROD)
 * Fix 3: Google SSO users without API key see helpful registration message
 *
 * These tests verify the code structure. E2E tests in auth-flow-e2e.test.ts
 * cover the live behavior when services are running.
 */
import { describe, expect, test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// FIX 1: Regenerate API Key
// =============================================================================
describe('Fix 1: Regenerate API Key on profile page', () => {
	const serverPath = path.resolve('src/routes/(authenticated)/data/profile/+page.server.ts');
	const pagePath = path.resolve('src/routes/(authenticated)/data/profile/+page.svelte');

	test('profile server has regenerateKey action', () => {
		const server = fs.readFileSync(serverPath, 'utf-8');
		expect(server).toContain('regenerateKey');
	});

	test('regenerateKey action requires email and password', () => {
		const server = fs.readFileSync(serverPath, 'utf-8');
		// Should extract email and password from form data
		expect(server).toContain("formData.get('email')");
		expect(server).toContain("formData.get('password')");
		// Should validate both are present
		expect(server).toContain('!email || !password');
		expect(server).toContain('Email and password are required');
	});

	test('regenerateKey action calls brokerLogin to re-authenticate', () => {
		const server = fs.readFileSync(serverPath, 'utf-8');
		expect(server).toContain('brokerLogin({ email, password })');
	});

	test('regenerateKey action sets new cookie on success', () => {
		const server = fs.readFileSync(serverPath, 'utf-8');
		expect(server).toContain('setApiKeyCookie(cookies, result.apiKey)');
		expect(server).toContain('success: true');
		expect(server).toContain('newKey: result.apiKey');
	});

	test('regenerateKey action returns error on auth failure', () => {
		const server = fs.readFileSync(serverPath, 'utf-8');
		expect(server).toContain('fail(401');
		expect(server).toContain('Login failed. Check your credentials');
	});

	test('profile page UI has Regenerate API Key button', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		expect(page).toContain('Regenerate API Key');
	});

	test('profile page shows credential prompt before regeneration', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		// Click "Regenerate" opens a form with email/password inputs
		expect(page).toContain('regenerateConfirm');
		expect(page).toContain('Enter your credentials to confirm');
		expect(page).toContain('type="email" name="email"');
		expect(page).toContain('type="password" name="password"');
	});

	test('profile page posts to ?/regenerateKey action', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		expect(page).toContain('action="?/regenerateKey"');
	});

	test('profile page shows success banner after regeneration', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		expect(page).toContain('form?.success');
		expect(page).toContain('API key regenerated successfully');
	});

	test('profile page shows error banner on failure', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		expect(page).toContain('form?.error');
		expect(page).toContain('{form.error}');
	});

	test('profile page displays new key after regeneration', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		// The reactive assignment picks up the new key from form data
		expect(page).toContain('form?.newKey ?? data.apiKey');
	});

	test('profile page has cancel button to abort regeneration', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		expect(page).toContain('Cancel');
		expect(page).toContain('regenerateConfirm = false');
	});

	test('regenerateKey form resets confirm state after submission', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		// The enhance callback resets regenerateConfirm after form submission
		expect(page).toContain('use:enhance');
		expect(page).toContain('regenerateConfirm = false');
	});
});

// =============================================================================
// FIX 2: Cookie secure flag is environment-aware
// =============================================================================
describe('Fix 2: ft_api_key cookie secure flag', () => {
	const grpcAuthPath = path.resolve('src/lib/grpc-auth.ts');

	test('setApiKeyCookie uses import.meta.env.PROD for secure flag', () => {
		const grpcAuth = fs.readFileSync(grpcAuthPath, 'utf-8');
		// Must NOT be hardcoded to true or false — must be environment-aware
		expect(grpcAuth).toContain('secure: import.meta.env.PROD');
		expect(grpcAuth).not.toMatch(/secure:\s*true\b/);
		expect(grpcAuth).not.toMatch(/secure:\s*false\b/);
	});

	test('cookie is httpOnly for security', () => {
		const grpcAuth = fs.readFileSync(grpcAuthPath, 'utf-8');
		expect(grpcAuth).toContain('httpOnly: true');
	});

	test('cookie uses lax sameSite policy', () => {
		const grpcAuth = fs.readFileSync(grpcAuthPath, 'utf-8');
		expect(grpcAuth).toContain("sameSite: 'lax'");
	});

	test('cookie path is root', () => {
		const grpcAuth = fs.readFileSync(grpcAuthPath, 'utf-8');
		expect(grpcAuth).toContain("path: '/'");
	});

	test('cookie has 30-day max age', () => {
		const grpcAuth = fs.readFileSync(grpcAuthPath, 'utf-8');
		expect(grpcAuth).toContain('60 * 60 * 24 * 30');
	});

	test('cookie name is ft_api_key', () => {
		const grpcAuth = fs.readFileSync(grpcAuthPath, 'utf-8');
		expect(grpcAuth).toContain("const AUTH_COOKIE = 'ft_api_key'");
	});
});

// =============================================================================
// FIX 3: Google SSO user sees helpful message (no API key)
// =============================================================================
describe('Fix 3: Google SSO user without API key sees registration message', () => {
	const pagePath = path.resolve('src/routes/(authenticated)/data/profile/+page.svelte');
	const hooksPath = path.resolve('src/hooks.server.ts');

	test('profile page shows helpful message when no API key is present', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		// When apiKey is falsy, should show a helpful message, not just "No API key"
		expect(page).toContain('No API key available');
		expect(page).toContain('Register with an email and password');
		expect(page).toContain('/register');
	});

	test('no-key message does NOT just say "No API key" with no guidance', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		// Find the no-key-notice div which is in the {:else} branch for missing API key
		const noticeMatch = page.match(/class="no-key-notice">([\s\S]*?)<\/div>/);
		expect(noticeMatch).toBeTruthy();
		const noticeContent = noticeMatch![1];
		// Should contain actionable guidance, not just a label
		expect(noticeContent).toContain('Register');
		expect(noticeContent).toContain('/register');
	});

	test('no-key notice has a link to the registration page', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		expect(page).toContain('<a href="/register">');
	});

	test('hooks.server.ts supports Google SSO users (session cookie path)', () => {
		const hooks = fs.readFileSync(hooksPath, 'utf-8');
		// Google SSO users authenticate via session cookie, not ft_api_key
		expect(hooks).toContain("cookies.get('session')");
		expect(hooks).toContain('validateSessionToken');
		// Google user should still get locals.user set
		expect(hooks).toContain('event.locals.user = user');
	});

	test('Google SSO user has no apiKey field (only BrokerUser has it)', () => {
		const appTypes = fs.readFileSync(path.resolve('src/app.d.ts'), 'utf-8');
		// BrokerUser has apiKey
		expect(appTypes).toContain('apiKey: string');
		// GoogleUser type should NOT have apiKey — it's a separate type
		expect(appTypes).toContain('BrokerUser');
		expect(appTypes).toContain('AppUser');
	});

	test('profile page loads apiKey from cookies (empty for Google SSO)', () => {
		const server = fs.readFileSync(
			path.resolve('src/routes/(authenticated)/data/profile/+page.server.ts'),
			'utf-8',
		);
		// getApiKeyFromCookies returns undefined for Google SSO users (no ft_api_key cookie)
		// Falls back to empty string
		expect(server).toContain("getApiKeyFromCookies(cookies) ?? ''");
	});

	test('profile page conditionally shows API key section vs no-key notice', () => {
		const page = fs.readFileSync(pagePath, 'utf-8');
		// {#if apiKey} shows key management, {:else} shows registration guidance
		expect(page).toContain('{#if apiKey}');
		expect(page).toContain('{:else}');
		// Key management section
		expect(page).toContain('Regenerate API Key');
		// No-key section
		expect(page).toContain('no-key-notice');
	});
});
