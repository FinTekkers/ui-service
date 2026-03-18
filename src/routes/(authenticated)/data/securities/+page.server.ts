import { FetchSecurity } from "$lib/security";

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const cusip = searchParams.get('cusip');
  const issueDate = searchParams.get('issueDate');
  const issueDateOperator = searchParams.get('issueDateOperator');

  const security = await FetchSecurity(
    "Fixed Income",
    "US Government",
    cusip || undefined,
    issueDate || undefined,
    issueDateOperator === 'greater_than' ? 'greater_than' : issueDateOperator === 'lesser_than' ? 'lesser_than' : undefined
  );

  return {
    security: security,
    user: locals.user
  };
}
