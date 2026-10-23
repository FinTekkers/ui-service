// /free/soma reads its mock only: no fetch, no backend call, no server load.
import { soma } from "$lib/free/mock/soma";
import type { SomaResponse } from "$lib/free/mock/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = (): SomaResponse => soma;
