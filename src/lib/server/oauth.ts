import { Google } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";

function getCallbackUrl() {
    let callbackUrl = "http://localhost:5173/login/google/callback";
    let aws_callback_url = `https://www.fintekkers.org:443/login/google/callback`;

    if (process.env.HOSTNAME && process.env.HOSTNAME.includes('.ec2.internal')) {
        callbackUrl = aws_callback_url;
        console.log("HOSTNAME environment variable found. Callback URL: " + callbackUrl);
    }

    for (const key in process.env) {
        if (key.startsWith('AWS')) {
            callbackUrl = aws_callback_url;
            console.log("AWS environment variable found. Callback URL: " + callbackUrl);
        }
    }

    if (process.env.PWD && process.env.PWD.includes('ec2-user')) {
        callbackUrl = aws_callback_url;
        console.log("Running in an EC2 user folder. Callback URL: " + aws_callback_url);
    }
    return callbackUrl;
}

let callbackUrl = getCallbackUrl();

console.log(`Callback URL: ${callbackUrl}`);
export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
