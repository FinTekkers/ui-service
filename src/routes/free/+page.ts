// US-254: /free is the explorer's front door and shows the SOMA dataset:
// the same soma.ts mock /free/soma loads (no fetch, no backend call), plus
// the dataset id the shell's picker marks as selected.
import type { FreeDataset } from "$lib/free/datasets";
import { soma } from "$lib/free/mock/soma";
import type { SomaResponse } from "$lib/free/mock/types";
import type { PageLoad } from "./$types";

type FreePageData = SomaResponse & { dataset: FreeDataset["id"] };

export const load: PageLoad = (): FreePageData => ({
  ...soma,
  dataset: "soma",
});

// SvelteKit 1.x keeps the root route's "always" trailing slash on a
// client-side navigation from / unless the leaf page sets its own, so the
// homepage's links to /free would land on /free/.
export const trailingSlash = "never";
