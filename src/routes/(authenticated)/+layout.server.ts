// src/routes/(protected)/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, cookies }) => {
	console.log("Locals:", JSON.stringify(locals, null, 2));
	console.log("Session Cookie:", cookies.get("session"));

	if (!locals.user) {
		console.log("No user found, redirecting to login page");
		throw redirect(302, '/login');
	}

	return {
		user: locals.user
	};
};