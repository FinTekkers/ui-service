import { dev } from '$app/environment';

import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';

import { database } from './database.server';
import { usersSessionsTable, usersTable } from './schema';

const dbAdapter = new DrizzleSQLiteAdapter(database, usersSessionsTable, usersTable);

export const lucia = new Lucia(dbAdapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},

	getUserAttributes: (attributes) => {
		return {
			name: attributes?.firstname,
			email: attributes.email
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			firstname: string;
			name: string;
			email: string;
		};
	}
}