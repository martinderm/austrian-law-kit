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

test("RIS search parser returns non-empty hits with titles and stable IDs", () => {
  const html = fixture("fixtures/ris/search-result-sample.html");
  const hits = parseRisSearchHtml(html, 10);

  assert.ok(hits.length >= 2);
  for (const hit of hits) {
    assert.ok(hit.title.trim().length > 0);
    assert.ok(hit.source_url.includes("Dokument.wxe"));
    assert.ok((hit.stable_id ?? "").trim().length > 0);
  }
});

test("RIS segment parser returns non-empty title/content and no not-found signal", () => {
  const html = fixture("fixtures/ris/segment-detail-sample.html");
  const parsed = parseRisSegmentHtml(html);

  assert.ok(parsed.title.trim().length > 0);
  assert.ok(parsed.content.includes("Jeder Mensch"));
  assert.equal(looksLikeRisNotFound(html), false);
});

test("RIS whole-law parser returns non-empty title/content and no not-found signal", () => {
  const html = fixture("fixtures/ris/whole-law-detail-sample.html");
  const parsed = parseRisWholeLawHtml(html);

  assert.ok(parsed.title.trim().length > 0);
  assert.ok(parsed.content.trim().length > 20);
  assert.equal(looksLikeRisWholeLawNotFound(html), false);
});

test("JUSLINE discussions parser extracts only discussion links from the reliable variant fixture", () => {
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
