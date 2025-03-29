import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
    console.log("Logging out...");
    cookies.delete('session', { path: '/' });
    throw redirect(302, '/login');
};