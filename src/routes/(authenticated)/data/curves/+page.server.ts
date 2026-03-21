import mockCurves from '$lib/data/mock-curves.json';

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals }) {
  return {
    curveDate: mockCurves.date,
    note: mockCurves.note,
    par: mockCurves.curves.par,
    spot: mockCurves.curves.spot,
    forward: mockCurves.curves.forward,
    user: locals.user,
  };
}
