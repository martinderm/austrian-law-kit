import type { RisApiSearchRequest, RisApiSearchResult } from "./types.js";
import { searchBundesrechtApi } from "./bundesrecht.js";
import { searchGemeindenApi, searchGemeindenApiRaw } from "./gemeinden.js";
import { searchLandesrechtApi } from "./landesrecht.js";

export { RIS_API_APPLICATIONS, RIS_API_ENDPOINTS } from "./applications.js";
export { searchGemeindenApiRaw } from "./gemeinden.js";
export { fetchHistoryApiRaw } from "./history.js";

export async function searchRisApi(request: RisApiSearchRequest): Promise<RisApiSearchResult> {
  if (request.scope === "municipal") {
    return searchGemeindenApi(request);
  }
  if (request.scope === "land") {
    return searchLandesrechtApi(request);
  }

  return searchBundesrechtApi(request);
}
