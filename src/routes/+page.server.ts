import * as Yup from "yup";

import { fetchAaplCloses, type Close } from "$lib/server/homepage-chart";

/** @type {import('./$types').PageServerLoad} */

const signInSchema = Yup.object({
  searchQuery: Yup.string()
    .min(3, "please enter a word")
    .required("please enter text"),
});

export const actions = {
  search: async ({ request }: { request: Request }) => {
    try {
      const data = await request.formData();
      const searchQuery = data.get("search");
      console.log("search query", searchQuery);
    } catch (error) {
      console.log("something went wrong", error);
    }
  },
};

// US-250: the "Live from the price service" chart. A server-held key, read
// at call time (never $env/static/private, which bakes it into the build),
// so logged-out visitors see the chart too. No `locals`: it never falls back
// to the visitor's key. Unset key, a failed call or no closes: empty state.
export async function load(): Promise<{ closes: Close[] }> {
  const apiKey = process.env.FT_HOMEPAGE_API_KEY?.trim();
  if (!apiKey) return { closes: [] };
  try {
    return { closes: await fetchAaplCloses(apiKey) };
  } catch (error) {
    // The message only: the error object can carry request metadata.
    console.log("Could not fetch AAPL closes", (error as Error)?.message);
    return { closes: [] };
  }
}
