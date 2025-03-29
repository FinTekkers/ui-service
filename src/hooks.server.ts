import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import { sequence } from "@sveltejs/kit/hooks";

import type { Handle } from "@sveltejs/kit";

// const bucket = new TokenBucket<string>(100, 1);

// const rateLimitHandle: Handle = async ({ event, resolve }) => {
// 	// Note: Assumes X-Forwarded-For will always be defined.
// 	const clientIP = event.request.headers.get("X-Forwarded-For");
// 	if (clientIP === null) {
// 		return resolve(event);
// 	}
// 	let cost: number;
// 	if (event.request.method === "GET" || event.request.method === "OPTIONS") {
// 		cost = 1;
// 	} else {
// 		cost = 3;
// 	}
// 	if (!bucket.consume(clientIP, cost)) {
// 		return new Response("Too many requests", {
// 			status: 429
// 		});
// 	}
// 	return resolve(event);
// };
// hooks.server.ts
export const handle = async ({ event, resolve }) => {
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
//
// const authHandle: Handle = async ({ event, resolve }) => {
// 	const token = event.cookies.get("session") ?? null;
// 	if (token === null) {
// 		console.log("No token; invalidating user/session");
// 		event.locals.user = null;
// 		event.locals.session = null;
// 		return resolve(event);
// 	}
//
// 	const { session, user } = validateSessionToken(token);
// 	if (session !== null) {
// 		setSessionTokenCookie(event, token, session.expiresAt);
// 	} else {
// 		deleteSessionTokenCookie(event);
// 	}
//
// 	event.locals.session = session;
// 	event.locals.user = user;
// 	return resolve(event);
// };
//
// export const handle = authHandle;
