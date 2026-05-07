import { db } from "./db";

export function createUser(googleId: string, email: string, name: string, picture: string): User {
    const row = db.queryOne("INSERT INTO user (google_id, email, name, picture) VALUES (?, ?, ?, ?) RETURNING user.id", [
        googleId,
        email,
        name,
        picture
    ]);
    if (row === null) {
        throw new Error("Unexpected error");
    }
    const user: User = {
        id: row.number(0),
        googleId,
        email,
        name,
        picture
    };
    return user;
}

export function getUserFromGoogleId(googleId: string): User | null {
    const row = db.queryOne("SELECT id, google_id, email, name, picture FROM user WHERE google_id = ?", [googleId]);
    if (row === null) {
        return null;
    }
    const user: User = {
        id: row.number(0),
        googleId: row.string(1),
        email: row.string(2),
        name: row.string(3),
        picture: row.string(4)
    };
    return user;
}

export interface User {
    id: number;
    email: string;
    googleId: string;
    name: string;
    picture: string;
    // Optional because the Google-session auth flow doesn't issue a
    // broker apiKey (only the BrokerUser flow in hooks.server.ts does).
    // Declared here so consumers that read `locals.user?.apiKey` across
    // the AppUser union (GoogleUser | BrokerUser) type-check without a
    // narrowing dance — matches the runtime where Google-flow returns
    // undefined and broker-flow returns the cookie value.
    apiKey?: string;
}