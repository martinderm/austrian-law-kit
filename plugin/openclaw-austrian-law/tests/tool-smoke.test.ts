import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  configureCacheRoot,
  resolveToolContextCacheRoot,
  runWithCacheRoot,
} from "../src/cache/cache-runtime.ts";
import { juslineFetchDiscussionsStub } from "../src/tools/jusline_fetch_discussions.ts";
import { juslineListDecisionsStub } from "../src/tools/jusline_list_decisions.ts";
import { risFetchSegmentStub } from "../src/tools/ris_fetch_segment.ts";
import { risFetchWholeLawStub } from "../src/tools/ris_fetch_whole_law.ts";
import { risSearchStub } from "../src/tools/ris_search.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

function fixture(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), "utf8");
}

function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`ok - ${name}`);
    })
    .catch((error) => {
      console.error(`not ok - ${name}`);
      throw error;
    });
}

async function withMockedFetch(
  handler: (input: string | URL | Request, init?: RequestInit) => Promise<Response> | Response,
  fn: () => Promise<void>,
): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => handler(input, init)) as typeof fetch;
  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function withTempCacheRoot<T>(fn: () => Promise<T> | T): Promise<T> {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openclaw-law-tool-smoke-"));
  configureCacheRoot(tempRoot);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      configureCacheRoot(undefined);
      rmSync(tempRoot, { recursive: true, force: true });
    });
}

await test("ris_search returns hits from a live-derived fixture-backed fetch", async () => {
  const html = fixture("fixtures/ris/abgb-search-live.html");

  await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
    const result = await risSearchStub({ query: "ABGB", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(result.data.hits.length >= 5);
    assert.ok(result.data.hits[0]?.title.trim().length);
    assert.equal(result.data.normalized_query, "ABGB");
    assert.equal(result.data.resolver_kind, "freeText");
    assert.equal(result.data.best_candidate?.source_id, result.data.hits[0]?.source_id);
  });
});

await test("ris_search resolves direct sourceId without upstream fetch", async () => {
  let fetchCalled = false;
  await withMockedFetch(async () => {
    fetchCalled = true;
    return new Response("should not happen", { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: "NOR40214078" });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(fetchCalled, false);
    assert.equal(result.data.resolver_kind, "sourceId");
    assert.equal(result.data.hits[0]?.source_id, "NOR40214078");
    assert.equal(result.data.best_candidate?.confidence, "high");
    assert.ok(result.meta.notices?.includes("resolver_shortcut: sourceId detected, RIS search skipped"));
  });
});

await test("ris_search resolves Landesrecht sourceId without upstream fetch", async () => {
  let fetchCalled = false;
  await withMockedFetch(async () => {
    fetchCalled = true;
    return new Response("should not happen", { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: "LOO12009295", scope: "land", state: "Oberösterreich" });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(fetchCalled, false);
    assert.equal(result.data.resolver_kind, "sourceId");
    assert.equal(result.data.hits[0]?.source_id, "LOO12009295");
    assert.equal(result.data.best_candidate?.confidence, "high");
    assert.ok(result.data.hits[0]?.source_url.includes("Abfrage=Landesnormen"));
  });
});

await test("ris_search uses the official RIS API first for Bundesrecht norm references", async () => {
  const apiJson = fixture("fixtures/ris-api/bundesrecht-abgb-1293.json");
  let htmlFetchCount = 0;

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/Bundesrecht")) {
      assert.ok(url.includes("Applikation=BrKons"));
      assert.ok(url.includes("Titel=ABGB"));
      assert.ok(url.includes("Suchworte="));
      return new Response(apiJson, { status: 200, headers: { "content-type": "application/json" } });
    }

    htmlFetchCount += 1;
    return new Response("<html></html>", { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: "§ 1293 ABGB", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(htmlFetchCount, 0);
    assert.equal(result.data.best_candidate?.source_id, "NOR12019035");
    assert.equal(result.data.best_candidate?.application, "BrKons");
    assert.equal(result.data.best_candidate?.law_id, "10001622");
    assert.ok(result.meta.notices?.includes("api_search: Bundesrecht"));
  });
});

await test("ris_search filters Landesrecht API hits by explicit state and tries title variants", async () => {
  const mixedJson = fixture("fixtures/ris-api/landesrecht-bauordnung-mixed-states.json");
  const mixedParsed = JSON.parse(mixedJson);
  const firstOnlyJson = JSON.stringify({
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '1' },
        OgdDocumentReference: mixedParsed.OgdSearchResult.OgdDocumentResults.OgdDocumentReference[0],
      },
    },
  });
  const exactJson = JSON.stringify({
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '1' },
        OgdDocumentReference: mixedParsed.OgdSearchResult.OgdDocumentResults.OgdDocumentReference[1],
      },
    },
  });
  let htmlFetchCount = 0;
  let apiCalls = 0;

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/Landesrecht")) {
      apiCalls += 1;
      assert.ok(url.includes("Applikation=LrKons"));
      assert.ok(url.includes("SucheInOberoesterreich=true"));
      if (url.includes("Titel=Bauordnung")) {
        return new Response(firstOnlyJson, { status: 200, headers: { "content-type": "application/json" } });
      }
      if (url.includes("Titel=O%C3%B6.+Bauordnung") || url.includes("Titel=O%C3%B6.%20Bauordnung") || url.includes("Titel=Oö.+Bauordnung") || url.includes("Titel=Oö.%20Bauordnung")) {
        return new Response(exactJson, { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ OgdSearchResult: { OgdDocumentResults: { Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '0' } } } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    htmlFetchCount += 1;
    return new Response("<html></html>", { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: "Bauordnung", scope: "land", state: "Oberösterreich", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(htmlFetchCount, 0);
    assert.ok(apiCalls >= 2);
    assert.equal(result.data.best_candidate?.source_id, "LOO40000077");
    assert.equal(result.data.best_candidate?.state, "Oberösterreich");
    assert.ok(result.meta.notices?.includes("api_search: Landesrecht"));
    assert.ok(result.meta.notices?.some((entry) => entry.startsWith("api_land_title_variant_used:")));
    assert.ok(result.meta.warnings?.includes("api_state_mismatch_filtered_count: 1"));
    assert.ok(result.meta.warnings?.includes("api_land_title_variant_no_results: Bauordnung"));
  });
});

await test("ris_search falls back to HTML when the RIS API is unavailable", async () => {
  const html = fixture("fixtures/ris/abgb-search-live.html");

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/")) {
      return new Response(JSON.stringify({ OgdSearchResult: { Error: { Applikation: "BrKons", Message: "temporary API outage" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(html, { status: 200 });
  }, async () => {
    const result = await risSearchStub({ query: "ABGB", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(result.meta.notices?.includes("html_fallback_used"));
    assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("api_variant_failed:")));
  });
});

await test("ris_search normalizes common norm references for the HTML fallback path", async () => {
  const html = fixture("fixtures/ris/abgb-search-live.html");

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/")) {
      return new Response(JSON.stringify({ OgdSearchResult: { Error: { Applikation: "BrKons", Message: "temporary API outage" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    assert.ok(url.includes("Titel=ABGB"));
    assert.ok(url.includes("VonParagraf=1293"));
    assert.ok(url.includes("BisParagraf=1293"));
    assert.ok(url.includes("Position=1"));
    assert.ok(url.includes("SkipToDocumentPage=true"));
    return new Response(html, { status: 200 });
  }, async () => {
    const result = await risSearchStub({ query: "§ 1293 abgb", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.normalized_query, "§ 1293 abgb");
    assert.equal(result.data.resolver_kind, "normRef");
    assert.ok(result.data.best_candidate);
    assert.ok(result.data.best_candidate?.match_reason);
    assert.ok(result.data.best_candidate?.confidence);
    assert.ok(result.meta.notices?.some((entry) => entry.startsWith("resolver_variants:")));
    assert.ok(result.meta.notices?.includes("html_fallback_used"));
  });
});

await test("ris_search returns VALIDATION_ERROR for too-short query", async () => {
  const result = await risSearchStub({ query: "a" });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "VALIDATION_ERROR");
});

await test("ris_search validates state for Landesnormen scope", async () => {
  const result = await risSearchStub({ query: "Bauordnung", scope: "land" });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "VALIDATION_ERROR");
  assert.ok(result.error.message.includes("Burgenland"));
});

await test("ris_search builds Landesnormen HTML fallback queries with explicit state", async () => {
  const html = fixture("fixtures/ris/abgb-search-live.html");

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/")) {
      return new Response(JSON.stringify({ OgdSearchResult: { Error: { Applikation: "LrKons", Message: "temporary API outage" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    assert.ok(url.includes("Abfrage=Landesnormen"));
    assert.ok(url.includes("Bundesland=Ober%C3%B6sterreich") || url.includes("Bundesland=Oberösterreich"));
    assert.ok(url.includes("BundeslandDefault=Ober%C3%B6sterreich") || url.includes("BundeslandDefault=Oberösterreich"));
    return new Response(html, { status: 200 });
  }, async () => {
    const result = await risSearchStub({ query: "Bauordnung", scope: "land", state: "Oberösterreich", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.resolver_kind, "freeText");
    assert.ok(result.meta.notices?.includes("html_fallback_used"));
  });
});

await test("ris_search retries HTML fallback on upstream 500 and succeeds on retry", async () => {
  const html = fixture("fixtures/ris/abgb-search-live.html");
  let htmlAttempts = 0;

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/")) {
      return new Response(JSON.stringify({ OgdSearchResult: { Error: { Applikation: "BrKons", Message: "temporary API outage" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    htmlAttempts += 1;
    if (htmlAttempts === 1) return new Response("upstream error", { status: 500 });
    return new Response(html, { status: 200 });
  }, async () => {
    const result = await risSearchStub({ query: "ABGB", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(htmlAttempts, 2);
  });
});

await test("ris_search falls back across normalized variants before returning NOT_FOUND", async () => {
  let htmlCalls = 0;

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/")) {
      return new Response(JSON.stringify({ OgdSearchResult: { OgdDocumentResults: { Hits: { "@pageNumber": "1", "@pageSize": "20", "#text": "0" } } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    htmlCalls += 1;
    return new Response("<html><body><table></table></body></html>", { status: 200 });
  }, async () => {
    const result = await risSearchStub({ query: "§ 1293 abgb", limit: 5 });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "NOT_FOUND");
    assert.ok(htmlCalls >= 2);
    assert.ok(result.meta?.warnings?.some((entry) => entry.startsWith("html_variant_no_results:")));
    assert.ok(result.meta?.warnings?.some((entry) => entry.startsWith("api_variant_no_results:")));
  });
});

await test("ris_search returns a direct document hit when HTML fallback resolves uniquely", async () => {
  const html = '<html><head><title>RIS - Allgemeines bürgerliches Gesetzbuch § 1293 - Bundesrecht konsolidiert</title></head><body><a href="/eli/jgs/1811/946/P1293/NOR12019035">Direkt</a></body></html>';

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/")) {
      return new Response(JSON.stringify({ OgdSearchResult: { Error: { Applikation: "BrKons", Message: "temporary API outage" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(html, { status: 200 });
  }, async () => {
    const result = await risSearchStub({ query: "§ 1293 ABGB", limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.best_candidate?.source_id, "NOR12019035");
    assert.equal(result.data.best_candidate?.confidence, "high");
    assert.ok(result.meta?.notices?.some((entry) => entry.startsWith("html_fallback_direct_document:")));
  });
});

await test("ris_search extracts Landesrecht direct-document ids from the URL context", async () => {
  const html = '<html><head><title>RIS - 1. Oö. Euro-Umstellungsgesetz Art. 1 - Landesrecht konsolidiert Oberösterreich</title></head><body><a href="/eli/lgbl/OB/1998/126/A1/LOO12009295">Direkt</a></body></html>';

  await withMockedFetch(async (input) => {
    const url = String(input);
    return new Response(html, { status: 200, headers: { 'x-test-url': url } });
  }, async () => {
    const result = await risSearchStub({ query: 'LOO12009295', scope: 'land', state: 'Oberösterreich', limit: 5 });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.best_candidate?.source_id, 'LOO12009295');
    assert.equal(result.data.best_candidate?.confidence, 'high');
  });
});

await test("ris_fetch_segment returns a usable artifact from a live-derived fixture-backed fetch", async () => {
  const html = fixture("fixtures/ris/nor40214078-live.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await risFetchSegmentStub({ sourceId: "NOR40214078" });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.data.artifact.frontmatter.doc_type, "norm_segment");
      assert.ok(result.data.artifact.content.trim().length > 30);
      assert.equal(result.data.artifact.content.includes("Startseite Bund Länder Bezirke Gemeinden"), false);
      assert.equal(result.data.artifact.frontmatter.law_title, "Straßenverkehrsordnung 1960");
      assert.equal(result.data.artifact.frontmatter.law_abbreviation, "StVO 1960");
      assert.equal(result.data.artifact.frontmatter.law_slug, "stvo");
      assert.equal(result.data.artifact.frontmatter.law_type, "BG");
      assert.equal(result.data.artifact.frontmatter.effective_date_raw, "01.06.2019");
      assert.equal(result.data.artifact.frontmatter.effective_date, "2019-06-01");
      assert.equal(result.data.artifact.frontmatter.index_label, "90/01 Straßenverkehrsrecht");
      assert.ok(result.data.artifact.frontmatter.promulgation?.includes("BGBl. Nr. 159/1960"));
      assert.equal(result.data.artifact.frontmatter.segment_ref, "§ 4");
      assert.equal(result.data.artifact.frontmatter.heading, "§ 4. Verkehrsunfälle.");
      assert.equal(result.data.artifact.frontmatter.title, "§ 4 StVO 1960 – Verkehrsunfälle.");
      assert.equal(result.data.artifact.frontmatter.norm_status, "current");
      const extracted = (result.data.artifact.metadata?.ris_extracted ?? {}) as Record<string, unknown>;
      assert.equal(extracted.law_slug, "stvo");
      assert.equal(extracted.heading, "§ 4. Verkehrsunfälle.");
      assert.equal(extracted.display_title, "§ 4 StVO 1960 – Verkehrsunfälle.");
    });
  });
});

await test("ris_fetch_segment returns VALIDATION_ERROR without source identifier", async () => {
  const result = await risFetchSegmentStub({});

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "VALIDATION_ERROR");
});

await test("ris_fetch_segment bypasses stale cache when refresh=true", async () => {
  const staleArtifact = {
    stable_id: "ris:segment:nor40214078",
    frontmatter: {
      stable_id: "ris:segment:nor40214078",
      source: "ris",
      source_url: "https://example.invalid/NOR40214078",
      doc_type: "norm_segment",
      title: "Bundesrecht konsolidiert",
      fetched_at: new Date().toISOString(),
      version_label: "stale",
      fassung_typ: "Arbeitsfassung",
      source_id: "NOR40214078",
    },
    content: "Startseite Bund Länder Bezirke Gemeinden",
  };
  const html = fixture("fixtures/ris/nor40214078-live.html");

  await withTempCacheRoot(async () => {
    await runWithCacheRoot(undefined, async () => {
      const { writeThroughCacheForRisArtifact } = await import("../src/cache/cache-write-through.ts");
      await writeThroughCacheForRisArtifact(staleArtifact as any);
    });

    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await risFetchSegmentStub({ sourceId: "NOR40214078", refresh: true });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.data.artifact.content.includes("Startseite Bund Länder Bezirke Gemeinden"), false);
      assert.ok(result.meta.notices?.includes("cache_refresh: bypassed cached artifact and fetched fresh content"));
    });
  });
});

await test("ris_fetch_whole_law returns a usable artifact from a live-derived fixture-backed fetch", async () => {
  const html = fixture("fixtures/ris/abgb-whole-law-live.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await risFetchWholeLawStub({ sourceId: "NOR12082462" });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.data.artifact.frontmatter.doc_type, "norm_document");
      assert.ok(result.data.artifact.content.trim().length > 100);
      assert.equal(result.data.artifact.content.includes("Startseite Bund Länder Bezirke Gemeinden"), false);
    });
  });
});

await test("ris_fetch_whole_law returns NOT_FOUND on HTTP 404", async () => {
  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response("not found", { status: 404 }), async () => {
      const result = await risFetchWholeLawStub({ sourceId: "NOR404" });

      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.error.code, "NOT_FOUND");
    });
  });
});

await test("jusline_fetch_discussions returns hits from fixture-backed fetch", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-discussions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await juslineFetchDiscussionsStub({ query: "stgb/paragraf/111", limit: 5 });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.ok(result.data.hits.length >= 1);
      assert.ok(result.data.hits[0]?.source_url.includes("/gesetzeskommentare/"));
      assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("preview_cache_written:")));
      assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("query_index_written:")));
    });
  });
});

await test("jusline_fetch_discussions returns NOT_FOUND for the negative comments fixture", async () => {
  const html = fixture("fixtures/jusline/stvo-paragraf-4.html");

  await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
    const result = await juslineFetchDiscussionsStub({ query: "stvo/paragraf/4" });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "NOT_FOUND");
  });
});

await test("jusline_fetch_discussions exposes refresh notice when refresh=true", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-discussions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await juslineFetchDiscussionsStub({ query: "stgb/paragraf/111", refresh: true });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.ok(result.meta.notices?.includes("cache_refresh: bypassed cached artifact and fetched fresh content"));
    });
  });
});

await test("jusline_list_decisions returns hits from fixture-backed fetch", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-decisions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await juslineListDecisionsStub({ query: "stgb/paragraf/111", limit: 5 });

      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.ok(result.data.hits.length >= 1);
      assert.ok(result.data.hits[0]?.source_url.includes("/entscheidungen/"));
      assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("preview_cache_written:")));
      assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("query_index_written:")));
    });
  });
});

await test("jusline_list_decisions returns VALIDATION_ERROR for too-short query", async () => {
  const result = await juslineListDecisionsStub({ query: "x" });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "VALIDATION_ERROR");
});

await test("jusline_list_decisions returns NOT_FOUND for the no-decisions fixture", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-no-decisions.html");

  await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
    const result = await juslineListDecisionsStub({ query: "stgb/paragraf/111" });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "NOT_FOUND");
  });
});

await test("jusline_list_decisions writes preview cache artifacts for repeated calls", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-decisions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const first = await juslineListDecisionsStub({ query: "stgb/paragraf/111", limit: 5 });
      assert.equal(first.ok, true);
      if (!first.ok) return;
      assert.ok(first.meta.warnings?.some((entry) => entry.startsWith("preview_cache_written:")));
      assert.ok(first.meta.warnings?.some((entry) => entry.startsWith("query_index_written:")));
    });

    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const second = await juslineListDecisionsStub({ query: "stgb/paragraf/111", limit: 5 });
      assert.equal(second.ok, true);
      if (!second.ok) return;
      assert.ok(
        second.meta.notices?.includes("full_cache_hit")
        || second.meta.notices?.includes("partial_cache_hit")
        || second.meta.notices?.includes("cache_miss"),
      );
    });
  });
});

await test("cache runtime resolves RIS cache under the calling agent workspace by default", async () => {
  const html = fixture("fixtures/ris/segment-detail-sample.html");
  const workspaceDir = mkdtempSync(path.join(os.tmpdir(), "openclaw-law-agent-workspace-"));
  const expectedCachePath = path.join(
    workspaceDir,
    "memory",
    "references",
    "austrian-law",
    "ris",
    "norms",
    "ris_segment_nor12082462.md",
  );
  const cacheRoot = resolveToolContextCacheRoot({ workspaceDir });

  await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
    const result = await runWithCacheRoot(cacheRoot, () => risFetchSegmentStub({ sourceId: "NOR12082462" }));

    assert.equal(result.ok, true);
    assert.equal(existsSync(expectedCachePath), true);
  });

  rmSync(workspaceDir, { recursive: true, force: true });
});

await test("cache runtime prefers configured cacheRoot over the calling agent workspace", async () => {
  const html = fixture("fixtures/ris/segment-detail-sample.html");
  const workspaceDir = mkdtempSync(path.join(os.tmpdir(), "openclaw-law-agent-workspace-"));
  const configuredCacheRoot = mkdtempSync(path.join(os.tmpdir(), "openclaw-law-configured-cache-"));
  const expectedCachePath = path.join(
    configuredCacheRoot,
    "ris",
    "norms",
    "ris_segment_nor12082462.md",
  );
  const cacheRoot = resolveToolContextCacheRoot({ configuredCacheRoot, workspaceDir });

  await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
    const result = await runWithCacheRoot(cacheRoot, () => risFetchSegmentStub({ sourceId: "NOR12082462" }));

    assert.equal(result.ok, true);
    assert.equal(existsSync(expectedCachePath), true);
  });

  rmSync(workspaceDir, { recursive: true, force: true });
  rmSync(configuredCacheRoot, { recursive: true, force: true });
});

console.log("tool smoke tests passed");
