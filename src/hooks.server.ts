import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	// Check for broker API key cookie first (new auth)
	const apiKeyCookie = event.cookies.get('ft_api_key');
	if (apiKeyCookie) {
		event.locals.user = {
			id: 'broker-auth',
			name: 'User',
			email: '',
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
