import { redirect } from "@sveltejs/kit";

// US-243: temporary public home for the "free data" links on /. Until
// US-244 ships the Free data explorer here, send visitors to the existing
// public data page. US-244's last item replaces this redirect.
export function load(): never {
  throw redirect(302, "/treasuries");
}
