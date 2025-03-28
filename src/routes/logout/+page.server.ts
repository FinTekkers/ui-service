// src/routes/logout/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ cookies }) => {
        console.log("Logging out");
        cookies.delete('session');
        throw redirect(302, '/login');
    }
};