import { Google } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";

// Callback URL is derived from the ORIGIN env var.
// Set ORIGIN in .env or the service launcher for each environment:
//   local dev:  ORIGIN=http://localhost:443
//   dev server: ORIGIN=https://dev.fintekkers.org
//   production: ORIGIN=https://www.fintekkers.org
const origin = process.env.ORIGIN || "http://localhost:443";
const callbackUrl = `${origin}/login/google/callback`;

console.log(`Callback URL: ${callbackUrl}`);
export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
