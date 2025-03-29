import { google } from "$lib/server/oauth";
import { generateCodeVerifier, generateState } from "arctic";

import type { RequestEvent } from "./$types";

export function GET(event: RequestEvent): Response {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

	console.log(`State generated was: ${state}`);
	console.log(`Code verifier was: ${codeVerifier}`);

	const secure = import.meta.env.PROD;
	console.log(`Secure: ${secure}`);

	event.cookies.set("google_oauth_state", state, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: secure,
		path: "/",
		sameSite: "lax"
	});
	event.cookies.set("google_code_verifier", codeVerifier, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: secure,
		path: "/",
		sameSite: "lax"
	});


	console.log(`google_oauth_state: ${event.cookies.get('google_oauth_state')}`);
	console.log(`google_code_verifier: ${event.cookies.get('google_code_verifier')}`);

	console.log(`url: ${url}`);

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
