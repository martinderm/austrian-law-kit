import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseRisSearchHtml } from "../src/ris/search-parser.ts";
import { looksLikeRisNotFound, parseRisSegmentHtml } from "../src/ris/segment-parser.ts";
import { looksLikeRisWholeLawNotFound, parseRisWholeLawHtml } from "../src/ris/whole-law-parser.ts";
import { looksLikeJuslineNoDiscussions, parseJuslineDiscussionsHtml } from "../src/jusline/discussions-parser.ts";
import { looksLikeJuslineNoDecisions, parseJuslineDecisionsHtml } from "../src/jusline/decisions-parser.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

function fixture(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), "utf8");
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("RIS search parser returns non-empty results with titles and stable IDs from a live-derived fixture", () => {
  const html = fixture("fixtures/ris/abgb-search-live.html");
  const hits = parseRisSearchHtml(html, 10);

  assert.ok(hits.length >= 5);
  for (const hit of hits) {
    assert.ok(hit.title.trim().length > 0);
    assert.ok(hit.source_url.includes("Dokument.wxe") || hit.source_url.includes("/eli/"));
    assert.ok((hit.stable_id ?? "").trim().length > 0);
  }
});

test("RIS segment parser extracts usable norm text from live-derived fixtures", () => {
  for (const relPath of [
    "fixtures/ris/nor12018853-live.html",
    "fixtures/ris/nor12019064-live.html",
    "fixtures/ris/nor40214078-live.html",
  ]) {
    const html = fixture(relPath);
    const parsed = parseRisSegmentHtml(html);

    assert.ok(parsed.title.trim().length > 0);
    assert.ok(parsed.content.trim().length > 30);
    assert.equal(parsed.content.includes("Startseite Bund Länder Bezirke Gemeinden"), false);
    assert.equal(looksLikeRisNotFound(html), false);
  }
});

test("RIS segment parser extracts rich metadata for NOR40214078", () => {
  const html = fixture("fixtures/ris/nor40214078-live.html");
  const parsed = parseRisSegmentHtml(html);

  assert.equal(parsed.lawTitle, "Straßenverkehrsordnung 1960");
  assert.equal(parsed.lawAbbreviation, "StVO 1960");
  assert.equal(parsed.lawSlug, "stvo");
  assert.equal(parsed.lawType, "BG");
  assert.equal(parsed.normStatus, "current");
  assert.equal(parsed.effectiveDateRaw, "01.06.2019");
  assert.equal(parsed.effectiveDate, "2019-06-01");
  assert.equal(parsed.indexLabel, "90/01 Straßenverkehrsrecht");
  assert.ok(parsed.promulgation?.includes("BGBl. Nr. 159/1960"));
  assert.equal(parsed.segmentRef, "§ 4");
  assert.equal(parsed.heading, "§ 4. Verkehrsunfälle.");
  assert.ok(parsed.content.startsWith("§ 4. Verkehrsunfälle."));
  assert.equal(parsed.content.includes("(2)"), true);
  assert.equal(parsed.content.includes("Absatz 2"), false);
});

test("RIS segment parser marks repealed ABGB segment as repealed", () => {
  const html = fixture("fixtures/ris/nor12018853-live.html");
  const parsed = parseRisSegmentHtml(html);

  assert.equal(parsed.lawAbbreviation, "ABGB");
  assert.equal(parsed.segmentRef, "§ 1124");
  assert.equal(parsed.normStatus, "repealed");
  assert.ok(parsed.promulgation?.includes("aufgehoben"));
});

test("RIS search parser deduplicates identical result links", () => {
  const html = `
    <table><tbody>
      <tr class="bocListDataRow odd">
        <td><a href="/eli/jgs/1811/946/P1/NOR12082462">§ 1</a></td>
        <td class="bocListTextContent">ABGB</td>
      </tr>
      <tr class="bocListDataRow even">
        <td><a href="/eli/jgs/1811/946/P1/NOR12082462">§ 1 doppelt</a></td>
        <td class="bocListTextContent">ABGB</td>
      </tr>
    </tbody></table>
  `;
  const hits = parseRisSearchHtml(html, 10);

  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.source_id, "NOR12082462");
});

test("RIS segment parser falls back from title extraction to body content on small HTML variations", () => {
  const html = `
    <!doctype html>
    <html lang="de">
      <head><title>ABGB § 2 - RIS</title></head>
      <body>
        <article>
          <p>Jedermann ist fähig, Rechte zu erwerben.</p>
        </article>
      </body>
    </html>
  `;
  const parsed = parseRisSegmentHtml(html);

  assert.equal(parsed.title, "ABGB § 2 - RIS");
  assert.ok(parsed.content.includes("Jedermann ist fähig"));
});

test("RIS whole-law parser returns non-empty title and content from a live-derived fixture", () => {
  const html = fixture("fixtures/ris/abgb-whole-law-live.html");
  const parsed = parseRisWholeLawHtml(html);

  assert.ok(parsed.title.trim().length > 0);
  assert.ok(parsed.content.trim().length > 100);
  assert.ok(parsed.content.includes("Paragraph 10") || parsed.content.includes("§ 10") || parsed.content.includes("10."));
  assert.equal(parsed.content.includes("Startseite Bund Länder Bezirke Gemeinden"), false);
  assert.equal(looksLikeRisWholeLawNotFound(html), false);
});

test("JUSLINE discussions parser extracts only discussion/comment links from the reliable variant fixture", () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-discussions-variant.html");
  const hits = parseJuslineDiscussionsHtml(html, 10);

  assert.ok(hits.length >= 1);
  for (const hit of hits) {
    assert.ok(hit.title.trim().length > 0);
    assert.ok(hit.source_url.includes("/gesetzeskommentare/"));
    assert.ok(hit.stable_id.startsWith("jusline:comment:"));
  }
});

test("JUSLINE decisions parser extracts only decision links from the reliable variant fixture", () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-decisions-variant.html");
  const hits = parseJuslineDecisionsHtml(html, 10);

  assert.ok(hits.length >= 1);
  for (const hit of hits) {
    assert.ok(hit.title.trim().length > 0);
    assert.ok(hit.source_url.includes("/entscheidungen/"));
    assert.ok(hit.stable_id.startsWith("jusline:dec:"));
  }
});

test("JUSLINE discussions parser ignores decision links and keeps snippets optional", () => {
  const html = `
    <h2><span class="capitalize">2</span> Kommentare zu § 111 StGB</h2>
    <a href="/gesetzeskommentare/456492721">Kommentar zum § 111 StGB</a>
    <div><a href="/entscheidungen/11/111/1">Entscheidungen des OGH</a></div>
  `;
  const hits = parseJuslineDiscussionsHtml(html, 10);

  assert.equal(hits.length, 1);
  assert.ok(hits[0]?.source_url.includes("/gesetzeskommentare/"));
  assert.equal("snippet" in (hits[0] ?? {}), false);
});

test("JUSLINE decisions parser deduplicates repeated decision links and ignores discussion/comment links", () => {
  const html = `
    <div id="decissions">
      <a href="/entscheidungen/11/111/1">Entscheidungen des OGH</a>
      <a href="/entscheidungen/11/111/1">Entscheidungen des OGH doppelt</a>
      <a href="/gesetzeskommentare/456492721">Kommentar zum § 111 StGB</a>
    </div>
  `;
  const hits = parseJuslineDecisionsHtml(html, 10);

  assert.equal(hits.length, 1);
  assert.ok(hits[0]?.source_url.includes("/entscheidungen/"));
  assert.equal(hits[0]?.source_id, "11/111/1");
});

test("JUSLINE decisions negative fixture yields no hits", () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-no-decisions.html");
  const hits = parseJuslineDecisionsHtml(html, 10);

  assert.equal(hits.length, 0);
  assert.equal(looksLikeJuslineNoDecisions(html), false);
});

test("JUSLINE discussions negative fixture yields no hits and explicit negative signal", () => {
  const html = fixture("fixtures/jusline/stvo-paragraf-4.html");
  const hits = parseJuslineDiscussionsHtml(html, 10);

  assert.equal(hits.length, 0);
  assert.equal(looksLikeJuslineNoDiscussions(html), true);
});

console.log("parser smoke tests passed");
