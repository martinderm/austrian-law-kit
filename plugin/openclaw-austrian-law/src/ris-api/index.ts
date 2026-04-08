import type { RisApiSearchRequest, RisApiSearchResult } from "./types.js";
import { searchBundesrechtApi } from "./bundesrecht.js";
import { searchLandesrechtApi } from "./landesrecht.js";

export async function searchRisApi(request: RisApiSearchRequest): Promise<RisApiSearchResult> {
  if (request.scope === "land") {
    return searchLandesrechtApi(request);
  }

  return searchBundesrechtApi(request);
}
