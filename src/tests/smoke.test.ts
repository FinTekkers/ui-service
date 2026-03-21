/**
 * Smoke tests for ui-service page load.
 *
 * These tests hit the running dev server at http://127.0.0.1:443
 * and verify that pages return expected HTTP statuses and content.
 *
 * Prerequisites: ui-service must be running (`npm run dev` or services.sh start ui-service)
 */
import { describe, expect, test } from 'vitest';

// Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues
const BASE_URL = 'http://127.0.0.1:443';

/** Helper: fetch a page without following redirects */
async function fetchPage(path: string, followRedirects = false) {
	const url = `${BASE_URL}${path}`;
	const response = await fetch(url, { redirect: followRedirects ? 'follow' : 'manual' });
	const body = await response.text();
	return { status: response.status, body, headers: response.headers, url };
}

describe('Smoke Tests – ui-service page load', () => {
	test('Homepage (/) returns HTTP 200 with valid HTML', async () => {
		const { status, body } = await fetchPage('/');
		expect(status).toBe(200);
		expect(body).toContain('<!DOCTYPE html>');
		expect(body).toContain('<html');
	});

	test('Homepage contains key page elements (head, body, script tags)', async () => {
		const { body } = await fetchPage('/');
		expect(body).toContain('<head>');
		expect(body).toContain('<meta charset="utf-8"');
		expect(body).toContain('<link rel="icon"');
		// SvelteKit apps should have a script for hydration
		expect(body).toMatch(/<script[^>]*>/);
	});

	test('Homepage does not contain server error messages', async () => {
		const { body } = await fetchPage('/');
		expect(body).not.toContain('Internal Server Error');
		expect(body).not.toContain('"message":"Internal Error"');
		// Check for HTTP 500 error patterns (not CSS color values like --color-500)
		expect(body).not.toMatch(/HTTP\s*500/i);
		expect(body).not.toMatch(/"status":\s*500/);
	});

	test('/login page does not return 500 Internal Server Error', async () => {
		const { status, body } = await fetchPage('/login');
		expect(status).not.toBe(500);
		expect(body).not.toContain('"message":"Internal Error"');
		// Login page should return 200 with HTML content
		expect(status).toBe(200);
		expect(body).toContain('<!DOCTYPE html>');
	});

	test('/data/positions redirects to login (auth required)', async () => {
		const { status, headers } = await fetchPage('/data/positions', false);
		// Should redirect (302) to login, not crash with 500
		expect(status).toBe(302);
		const location = headers.get('location');
		expect(location).toContain('/login');
	});

	test('/data/positions does not return 500 after following redirect', async () => {
		const { status, body } = await fetchPage('/data/positions', true);
		// After redirect, should get login page (200) not 500
		expect(status).not.toBe(500);
		expect(body).not.toContain('"message":"Internal Error"');
	});

	test('/data/securities redirects to login (auth required)', async () => {
		const { status, headers } = await fetchPage('/data/securities', false);
		expect(status).toBe(302);
		const location = headers.get('location');
		expect(location).toContain('/login');
	});

	test('/data/securities does not return 500 after following redirect', async () => {
		const { status, body } = await fetchPage('/data/securities', true);
		expect(status).not.toBe(500);
		expect(body).not.toContain('"message":"Internal Error"');
	});

	test('Static assets are served (favicon)', async () => {
		const { status } = await fetchPage('/favicon.png');
		expect(status).toBe(200);
	});
});
