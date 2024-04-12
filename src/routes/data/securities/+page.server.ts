//Requests & Services

import { FetchSecurity } from "$lib/security";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const security = await FetchSecurity("Fixed Income", "US Government");
  return { security };
}