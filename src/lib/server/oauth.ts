import { Google } from "arctic";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";

/**
 * You can override this to https when you're running 'npm run dev'
 * AND hosting the server behind a proxy that provides https.
 *
 * This should be refactored to have dynamic behavior. This confused me
 * a bunch. Without this you might see cross-origin posting errors
 */
let protocol_override:any = undefined;// = "https";

function getCallbackUrl() {
    let protocol = import.meta.env.PROD ? "https" : "http";
    protocol = protocol_override ? protocol_override : protocol;

    console.log(`Using ${protocol}`);
    let callbackUrl = `${protocol}://localhost:443/login/google/callback`;
    let aws_callback_url = `https://www.fintekkers.org:443/login/google/callback`;

    if (process.env.HOSTNAME && process.env.HOSTNAME.includes('.ec2.internal')) {
        callbackUrl = aws_callback_url;
        console.log("HOSTNAME environment variable found. Callback URL: " + callbackUrl);
    } else  if (process.env.PWD && process.env.PWD.includes('ec2-user')) {
        callbackUrl = aws_callback_url;
        console.log("Running in an EC2 user folder. Callback URL: " + aws_callback_url);
    } else {
        for (const key in process.env) {
            if (key.startsWith('AWS')) {
                callbackUrl = aws_callback_url;
                console.log("AWS environment variable found. Callback URL: " + callbackUrl);
            }
        }
    }


    return callbackUrl;
}

let callbackUrl = getCallbackUrl();

console.log(`Callback URL: ${callbackUrl}`);
export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
