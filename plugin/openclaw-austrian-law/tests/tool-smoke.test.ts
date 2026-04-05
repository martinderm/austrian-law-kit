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
  });
});

await test("ris_search returns VALIDATION_ERROR for too-short query", async () => {
  const result = await risSearchStub({ query: "a" });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "VALIDATION_ERROR");
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
        second.meta.notices?.includes("cache_hit: reused cached artifact")
        || second.meta.warnings?.some((entry) => entry.startsWith("query_index_written:"))
        || second.meta.warnings?.some((entry) => entry.startsWith("preview_cache_written:")),
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
