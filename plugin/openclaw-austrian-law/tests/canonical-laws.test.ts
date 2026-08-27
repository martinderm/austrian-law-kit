import assert from "node:assert/strict";
import {
  lookupCanonicalLaw,
  lookupGesetzesnummer,
  getCanonicalWholeLawUrl,
  getCanonicalAbbreviation,
  getAllCanonicalLaws,
  CANONICAL_LAWS,
} from "../src/ris/canonical-laws.js";
import { resolveRisQuery } from "../src/ris/query-resolver.js";
import { risFetchWholeLawStub } from "../src/tools/ris_fetch_whole_law.js";
import { configureCacheRoot } from "../src/cache/cache-runtime.js";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

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

function withTempCacheRoot<T>(fn: () => Promise<T> | T): Promise<T> {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openclaw-canon-test-"));
  configureCacheRoot(tempRoot);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      configureCacheRoot(undefined);
      rmSync(tempRoot, { recursive: true, force: true });
    });
}

// 1. Registry completeness
await test("canonical-laws: registry contains core Austrian federal laws", () => {
  assert.ok(CANONICAL_LAWS.length >= 30, `Expected at least 30 canonical laws, got ${CANONICAL_LAWS.length}`);
  const all = getAllCanonicalLaws();
  assert.equal(all.length, CANONICAL_LAWS.length);
});

// 2. Lookup by slug, abbreviation, and Gesetzesnummer
await test("canonical-laws: lookup by slug, abbreviation, and Gesetzesnummer", () => {
  // ABGB
  const abgb = lookupCanonicalLaw("abgb");
  assert.ok(abgb);
  assert.equal(abgb?.gesetzesnummer, "10001622");
  assert.equal(abgb?.abbreviation, "ABGB");

  // MRG
  const mrg = lookupCanonicalLaw("MRG");
  assert.ok(mrg);
  assert.equal(mrg?.gesetzesnummer, "10002531");

  // WEG
  const weg = lookupCanonicalLaw("WEG");
  assert.ok(weg);
  assert.equal(weg?.gesetzesnummer, "20001921");
  assert.equal(weg?.abbreviation, "WEG");

  // Lookup by Gesetzesnummer
  const fromNum = lookupCanonicalLaw("10002894");
  assert.ok(fromNum);
  assert.equal(fromNum?.slug, "heizkg");

  // EStG 1988
  const estg = lookupCanonicalLaw("estg1988");
  assert.ok(estg);
  assert.equal(estg?.gesetzesnummer, "10004570");

  // UStG 1994
  const ustg = lookupCanonicalLaw("ustg");
  assert.ok(ustg);
  assert.equal(ustg?.gesetzesnummer, "10004873");
});

// 3. Lookup by full German title and aliases
await test("canonical-laws: lookup by full title and German aliases", () => {
  assert.equal(lookupGesetzesnummer("Mietrechtsgesetz"), "10002531");
  assert.equal(lookupGesetzesnummer("Konsumentenschutzgesetz"), "10002462");
  assert.equal(lookupGesetzesnummer("Allgemeines bürgerliches Gesetzbuch"), "10001622");
  assert.equal(lookupGesetzesnummer("Wohnungseigentumsgesetz 2002"), "20001921");
  assert.equal(lookupGesetzesnummer("Einkommensteuergesetz"), "10004570");
  assert.equal(lookupGesetzesnummer("Strafgesetzbuch"), "10002296");
  assert.equal(lookupGesetzesnummer("Handelsgesetzbuch"), "10001702"); // UGB / HGB
  assert.equal(lookupGesetzesnummer("Bundes-Verfassungsgesetz"), "10000138");
});

// 4. Helper functions: URL and abbreviation
await test("canonical-laws: getCanonicalWholeLawUrl and getCanonicalAbbreviation", () => {
  const url = getCanonicalWholeLawUrl("MRG");
  assert.equal(url, "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002531");

  const abbr = getCanonicalAbbreviation("mietrechtsgesetz");
  assert.equal(abbr, "MRG");

  const none = lookupCanonicalLaw("nonexistent_law_xyz");
  assert.equal(none, undefined);
  assert.equal(lookupGesetzesnummer("nonexistent_law_xyz"), undefined);
});

// 5. Integration: Query resolver enriches normRef and freeText with canonical metadata
await test("canonical-laws: query resolver enriches resolved queries with lawId and canonicalTitle", () => {
  const resolvedMrg = resolveRisQuery("MRG § 29");
  assert.equal(resolvedMrg.kind, "normRef");
  if (resolvedMrg.kind === "normRef") {
    assert.equal(resolvedMrg.lawAbbreviation, "MRG");
    assert.equal(resolvedMrg.sectionRef, "§ 29");
    assert.equal(resolvedMrg.lawId, "10002531");
    assert.equal(resolvedMrg.canonicalTitle, "Mietrechtsgesetz");
    assert.ok(resolvedMrg.searchVariants.some((v) => v.includes("Mietrechtsgesetz § 29")));
  }

  const resolvedKschg = resolveRisQuery("§ 6 KSchG");
  assert.equal(resolvedKschg.kind, "normRef");
  if (resolvedKschg.kind === "normRef") {
    assert.equal(resolvedKschg.lawId, "10002462");
    assert.equal(resolvedKschg.canonicalTitle, "Konsumentenschutzgesetz");
  }

  const resolvedWeg = resolveRisQuery("WEG § 16");
  assert.equal(resolvedWeg.kind, "normRef");
  if (resolvedWeg.kind === "normRef") {
    assert.equal(resolvedWeg.lawId, "20001921");
    assert.equal(resolvedWeg.lawAbbreviation, "WEG");
  }

  const resolvedFree = resolveRisQuery("Wohnungsgemeinnützigkeitsgesetz");
  assert.equal(resolvedFree.kind, "freeText");
  if (resolvedFree.kind === "freeText") {
    assert.equal(resolvedFree.lawId, "10002540");
    assert.equal(resolvedFree.canonicalTitle, "Wohnungsgemeinnützigkeitsgesetz");
  }
});

// 6. Integration: ris_fetch_whole_law fast-path for canonical law queries
await test("canonical-laws: ris_fetch_whole_law uses fast-path for known law alias", async () => {
  const dummyHtml = `<!doctype html><html><head><title>MRG Gesamtfassung</title></head><body>
    <div id="Title">Gesamte Rechtsvorschrift für Mietrechtsgesetz, Fassung vom 27.08.2026</div>
    <div class="documentContent"><p>§ 1 Geltungsbereich</p></div>
  </body></html>`;

  await withTempCacheRoot(async () => {
    const originalFetch = globalThis.fetch;
    let fetchedUrl = "";
    globalThis.fetch = (async (input: string | URL | Request) => {
      fetchedUrl = String(input);
      return new Response(dummyHtml, { status: 200 });
    }) as typeof fetch;

    try {
      const res = await risFetchWholeLawStub({ query: "MRG" });
      assert.equal(res.success, true);
      if (!res.success) return;
      assert.ok(fetchedUrl.includes("Gesetzesnummer=10002531"));
      assert.equal(res.data.receipt?.gesetzesnummer, "10002531");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

console.log("canonical-laws tests passed");