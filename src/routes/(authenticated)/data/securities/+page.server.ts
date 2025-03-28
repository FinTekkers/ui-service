import { FetchSecurity } from "$lib/security";

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({locals}) {
  // session
  const security = await FetchSecurity("Fixed Income", "US Government");
  return {
    security: security,
    user: locals.user
  };
}