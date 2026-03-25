import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import type { Handle } from "@sveltejs/kit";

// Patch console to prepend ISO timestamps to every server log line
(['log', 'info', 'warn', 'error', 'debug'] as const).forEach((method) => {
  const original = console[method].bind(console);
  console[method] = (...args: unknown[]) => {
    original(`[${new Date().toISOString()}]`, ...args);
  };
});

export const handle: Handle = async ({ event, resolve }) => {
	// Check for broker API key cookie first (new auth)
	const apiKeyCookie = event.cookies.get('ft_api_key');
	if (apiKeyCookie) {
		event.locals.user = {
			id: 'broker-auth',
			name: event.cookies.get('ft_user_name') ?? 'User',
			email: event.cookies.get('ft_user_email') ?? '',
			apiKey: apiKeyCookie,
		};
		return resolve(event);
	}

	// Fall back to legacy Google OAuth session auth
	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		const { session, user } = validateSessionToken(sessionCookie);
		if (session !== null) {
			setSessionTokenCookie(event, sessionCookie, session.expiresAt);
		} else {
			deleteSessionTokenCookie(event);
		}
		event.locals.user = user;
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
