import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
	id: text('id').primaryKey().notNull(),

	lastname: text('lastname').notNull(),

	firstname: text('firstname'),

	email: text('email').notNull().unique(),

	password: text('password').notNull(),

	confirmpassword: text('confirmpassword'),

	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const usersSessionsTable = sqliteTable('users_sessions', {
	id: text('id').primaryKey().notNull(),

	userId: text('user_id')
		.notNull()
		.references(() => usersTable.id),

	expiresAt: integer('expires_at').notNull()
});

export type UserInsertSchema = typeof usersTable.$inferInsert;