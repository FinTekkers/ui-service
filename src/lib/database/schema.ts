import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
	id: text('id').primaryKey().notNull(),

	lastname: text('lastname'),

	firstname: text('firstname'),

	email: text('email').notNull().unique(),

	isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(false),

	password: text('password'),

	confirmpassword: text('confirmpassword'),

	authMethods: text('auth_methods', { mode: 'json' }).$type<string[]>().notNull(),

	avatarUrl:text('photo_url'),

	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const oauthAccountsTable = sqliteTable(
	'oauth_accounts',
	{
		userId: text('user_id')
			.notNull()
			.references(() => usersTable.id, {
				onDelete: 'cascade'
			}),

		providerId: text('provider_id').notNull(),

		providerUserId: text('provider_user_id').notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.providerId, t.providerUserId] })
	})
);

export const usersSessionsTable = sqliteTable('users_sessions', {
	id: text('id').primaryKey().notNull(),

	userId: text('user_id')
		.notNull()
		.references(() => usersTable.id),

	expiresAt: integer('expires_at').notNull()
});

export type UserInsertSchema = typeof usersTable.$inferInsert;