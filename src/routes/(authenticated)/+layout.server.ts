import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	if (!locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		throw redirect(302, `/login?redirectTo=${redirectTo}`);
	}

	return {
		user: locals.user
	};
};