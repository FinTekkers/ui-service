import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

const db = new Database('users_database.db');

// Ensure the api_keys table exists
db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        usage_limit INTEGER NOT NULL DEFAULT 10,
        usage_count INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

const generateApiKey = () => {
    return uuidv4();
};

export const createApiKey = async (userId: string, usageLimit: number, expiresInDays = 30) => {
    const apiKey = generateApiKey();

    const stmt = db.prepare(
        `INSERT INTO api_keys (user_id, key, usage_limit) VALUES (?, ?, ?)`
    );
    stmt.run(userId, apiKey, usageLimit);

    console.log('the api key', apiKey);

    return apiKey;
};

export const validateApiKey = async (apiKey: string) => {
    const row = db.prepare(
        `SELECT * FROM api_keys WHERE key = ?`
    ).get(apiKey) as any;

    if (!row) {
        throw new Error('Invalid API key');
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
        throw new Error('API key expired');
    }

    if (row.usage_count >= row.usage_limit) {
        throw new Error('API key usage limit reached');
    }

    db.prepare(
        `UPDATE api_keys SET usage_count = usage_count + 1 WHERE key = ?`
    ).run(apiKey);

    return true;
};
