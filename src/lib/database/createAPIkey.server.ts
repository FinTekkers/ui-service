import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
    filename: 'users_database.db',
    driver: sqlite3.Database
});

const generateApiKey = () => {
    return uuidv4();
};

export const createApiKey = async (userId: string, usageLimit:number, expiresInDays=30) => {
    const db = await dbPromise;
    const apiKey = generateApiKey();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);


    await db.run(
        `INSERT INTO api_keys (user_id, key, usage_limit) VALUES (?, ?, ?)`,
        [userId, apiKey, usageLimit]
    );

    console.log('the api key', apiKey)

    return apiKey;
};


export const validateApiKey = async (apiKey: string) => {
    const db = await dbPromise;

    const row = await db.get(
        `SELECT * FROM api_keys WHERE key = ?`,
        [apiKey]
    );

    if (!row) {
        throw new Error('Invalid API key');
    }

    if (new Date(row.expires_at) < new Date()) {
        throw new Error('API key expired');
    }

    if (row.usage_count >= row.usage_limit) {
        throw new Error('API key usage limit reached');
    }

    await db.run(
        `UPDATE api_keys SET usage_count = usage_count + 1 WHERE key = ?`,
        [apiKey]
    );

    return true;
};