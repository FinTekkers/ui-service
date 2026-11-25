import { redirect } from "@sveltejs/kit";

// US-338: /free/spy (US-334) moved to /free/etf/spy. A permanent redirect,
// so bookmarks and links keep working. GET also answers HEAD.
export function GET(): never {
  throw redirect(301, "/free/etf/spy");
}
