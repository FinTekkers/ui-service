import { loadFreeSoma } from "$lib/server/free-soma";
import type { FreeDataset } from "$lib/free/datasets";
import type { SomaPageWithHistory } from "$lib/free/soma";

// US-254 / US-307: /free is the explorer's front door and shows the SOMA
// dataset: the same live holdings /free/soma loads, from the same helper
// and key, read at call time, plus the dataset id the shell's picker marks
// as selected. US-317: including the streamed Holdings over time.
export async function load({
  url,
}: {
  url: URL;
}): Promise<SomaPageWithHistory & { dataset: FreeDataset["id"] }> {
  const data = await loadFreeSoma(
    process.env.FT_HOMEPAGE_API_KEY?.trim(),
    url.searchParams.get("asOf"),
    new Date()
  );
  return { ...data, dataset: "soma" };
}

// SvelteKit 1.x keeps the root route's "always" trailing slash on a
// client-side navigation from / unless the leaf page sets its own, so the
// homepage's links to /free would land on /free/.
export const trailingSlash = "never";
