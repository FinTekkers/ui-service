// src/routes/(protected)/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	console.log("Locals :"+ locals);
	if (!locals.user) {
		// Not logged in — redirect to login
		throw redirect(302, '/login');
	}

	// User is authenticated
	return {
		user: locals.user
	};
};