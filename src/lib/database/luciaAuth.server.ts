import { dev } from '$app/environment';

import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';

import { database } from './database.server';
// import { GitHub, Google } from 'arctic';
import { usersSessionsTable, usersTable } from './schema';
// import {
// 	GOOGLE_CLIENT_ID,
// 	GOOGLE_CLIENT_SECRET
// } from '$env/static/private';

const dbAdapter = new DrizzleSQLiteAdapter(database, usersSessionsTable, usersTable);

// let googleRedirectUrl = `http://localhost:443/oauth/google/callback`;
//
// console.log(process.env);
//
// for (const key in process.env) {
// 	if (key.startsWith('AWS')) {
// 		googleRedirectUrl = `https://www.fintekkers.org:443/oauth/google/callback`;
// 		console.log("AWS environment variable found. Callback URL: "+ googleRedirectUrl);
// 	}
// }
//
// if (process.env.HOSTNAME && process.env.HOSTNAME.includes('.ec2.internal')) {
// 	googleRedirectUrl = `https://www.fintekkers.org:443/oauth/google/callback`;
// 	console.log("HOSTNAME environment variable found. Callback URL: "+ googleRedirectUrl);
// }
//
// if (process.env.PWD && process.env.PWD.includes('ec2-user')) {
// 	googleRedirectUrl = `https://www.fintekkers.org:443/oauth/google/callback`;
// 	console.log("Running in an EC2 user folder. Callback URL: "+ googleRedirectUrl);
// }
// console.log("Callback URL: "+ googleRedirectUrl);


export const lucia = new Lucia(dbAdapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},

	getUserAttributes: (attributes) => {
		return {
			name: attributes?.firstname,
			email: attributes.email,
			isEmailVerified: attributes.isEmailVerified,
			authMethods: attributes.authMethods,
			avatarUrl: attributes.avatarUrl
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			avatarUrl: string;
			authMethods: string[];
			isEmailVerified: boolean;
			firstname: string;
			name: string;
			email: string;
		};
	}
}