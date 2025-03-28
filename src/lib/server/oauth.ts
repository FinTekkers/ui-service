import { Google } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";

let callbackUrl = "http://localhost:5173/login/google/callback";
console.log(`Callback URL: ${callbackUrl}`);

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
