import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildJuslineArtifactPreviews, deriveContextFromQuery } from "../../plugin/openclaw-austrian-law/src/jusline/artifact-previews.ts";
import { juslineFetchDiscussionsStub } from "../../plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts";
import { juslineListDecisionsStub } from "../../plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts";

type ExpectedOk = { ok: true; minHits: number; urlIncludes: string };
type ExpectedError = { ok: false; errorCode: string };

type DiscussionCase = {
  name: string;
  kind: "discussions";
  input: { query: string; limit?: number; refresh?: boolean };
  expected: ExpectedOk | ExpectedError;
};

type DecisionCase = {
  name: string;
  kind: "decisions";
  input: { query: string; limit?: number; refresh?: boolean };
  expected: ExpectedOk | ExpectedError;
};

type LiveCase = DiscussionCase | DecisionCase;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.join(__dirname, "results");

function makeTimestampFilePart(value: string): string {
  return value.replace(/[:.]/g, "-");
}

const cases: LiveCase[] = [
  { name: "discussions:path:stgb-111", kind: "discussions", input: { query: "stgb/paragraf/111", limit: 5, refresh: true }, expected: { ok: true, minHits: 1, urlIncludes: "/gesetzeskommentare/" } },
  { name: "discussions:url:stgb-111", kind: "discussions", input: { query: "https://www.jusline.at/gesetz/stgb/paragraf/111", limit: 5, refresh: true }, expected: { ok: true, minHits: 1, urlIncludes: "/gesetzeskommentare/" } },
  { name: "decisions:path:stgb-111", kind: "decisions", input: { query: "stgb/paragraf/111", limit: 5, refresh: true }, expected: { ok: true, minHits: 1, urlIncludes: "/entscheidungen/" } },
  { name: "decisions:url:stgb-111", kind: "decisions", input: { query: "https://www.jusline.at/gesetz/stgb/paragraf/111", limit: 5, refresh: true }, expected: { ok: true, minHits: 1, urlIncludes: "/entscheidungen/" } },
  { name: "discussions:path:stvo-4", kind: "discussions", input: { query: "stvo/paragraf/4", limit: 5, refresh: true }, expected: { ok: false, errorCode: "NOT_FOUND" } },
  { name: "decisions:path:stvo-4", kind: "decisions", input: { query: "stvo/paragraf/4", limit: 5, refresh: true }, expected: { ok: true, minHits: 1, urlIncludes: "/entscheidungen/" } },
];

function makeBaseCaseRecord(testCase: LiveCase) {
  return { name: testCase.name, kind: testCase.kind, query: testCase.input.query, ...deriveContextFromQuery(testCase.input.query) };
}

async function runCase(testCase: LiveCase) {
  const base = makeBaseCaseRecord(testCase);
  const context = deriveContextFromQuery(testCase.input.query);
  const result = testCase.kind === "discussions" ? await juslineFetchDiscussionsStub(testCase.input) : await juslineListDecisionsStub(testCase.input);

  if (testCase.expected.ok) {
    assert.equal(result.ok, true, `expected ok=true for ${testCase.name}`);
    if (!result.ok) return { ...base, ok: false, reason: `${result.error.code}: ${result.error.message}` };
    const hits = result.data.hits ?? [];
    assert.ok(hits.length >= testCase.expected.minHits, `expected at least ${testCase.expected.minHits} hits for ${testCase.name}`);
    assert.ok(hits[0]?.source_url.includes(testCase.expected.urlIncludes), `expected first hit url to include ${testCase.expected.urlIncludes} for ${testCase.name}`);
    const previewResult = await buildJuslineArtifactPreviews({ hits, kind: testCase.kind, input: testCase.input, context });
    return {
      ...base,
      ok: true,
      hitCount: hits.length,
      firstHit: hits[0] ? { title: hits[0].title, source_url: hits[0].source_url, source_id: hits[0].source_id, stable_id: hits[0].stable_id } : null,
      artifact_previews: previewResult.previews,
      skipped_previews: previewResult.skipped,
      notices: result.meta?.notices ?? [],
    };
  }

  assert.equal(result.ok, false, `expected ok=false for ${testCase.name}`);
  if (result.ok) return { ...base, ok: false, reason: `expected error ${testCase.expected.errorCode}, got success` };
  assert.equal(result.error.code, testCase.expected.errorCode, `expected ${testCase.expected.errorCode} for ${testCase.name}`);
  return { ...base, ok: true, error: result.error };
}

function renderMarkdown(report: { ranAt: string; total: number; failed: number; summary: Array<Record<string, unknown>> }): string {
  const lines: string[] = ["# JUSLINE Live Check", "", `- Ran at: ${report.ranAt}`, `- Total: ${report.total}`, `- Failed: ${report.failed}`, "", "## Results", ""];
  for (const item of report.summary) {
    const name = String(item.name ?? "unnamed");
    const ok = item.ok === true;
    lines.push(`### ${ok ? "PASS" : "FAIL"} - ${name}`, "");
    const kind = item.kind ? String(item.kind) : null;
    const query = item.query ? String(item.query) : null;
    const sourcePath = item.source_path ? String(item.source_path) : null;
    const lawSlug = item.law_slug ? String(item.law_slug) : null;
    const segmentRef = item.segment_ref ? String(item.segment_ref) : null;
    if (kind) lines.push(`- kind: ${kind}`);
    if (query) lines.push(`- query: \`${query}\``);
    if (sourcePath) lines.push(`- source_path: \`${sourcePath}\``);
    if (lawSlug) lines.push(`- law_slug: \`${lawSlug}\``);
    if (segmentRef) lines.push(`- segment_ref: ${segmentRef}`);
    if (typeof item.hitCount === "number") lines.push(`- hitCount: ${item.hitCount}`);
    const firstHit = item.firstHit as Record<string, unknown> | undefined;
    if (firstHit) {
      lines.push("- firstHit:");
      if (firstHit.title) lines.push(`  - title: ${String(firstHit.title)}`);
      if (firstHit.source_url) lines.push(`  - source_url: ${String(firstHit.source_url)}`);
      if (firstHit.source_id) lines.push(`  - source_id: ${String(firstHit.source_id)}`);
      if (firstHit.stable_id) lines.push(`  - stable_id: ${String(firstHit.stable_id)}`);
    }
    const error = item.error as Record<string, unknown> | undefined;
    if (error) {
      lines.push("- error:");
      if (error.code) lines.push(`  - code: ${String(error.code)}`);
      if (error.message) lines.push(`  - message: ${String(error.message)}`);
    }
    const notices = Array.isArray(item.notices) ? item.notices : [];
    if (notices.length > 0) {
      lines.push("- notices:");
      for (const notice of notices) lines.push(`  - ${String(notice)}`);
    }
    const previews = Array.isArray(item.artifact_previews) ? item.artifact_previews as Array<Record<string, unknown>> : [];
    if (previews.length > 0) {
      lines.push("", "#### Artifact previews (would land in memory)", "");
      for (const preview of previews) {
        if (preview.markdown_path) lines.push(`- markdown_path: \`${String(preview.markdown_path)}\``);
        if (preview.metadata_path) lines.push(`- metadata_path: \`${String(preview.metadata_path)}\``);
        lines.push("");
        if (preview.markdown_content) lines.push("```md", String(preview.markdown_content), "```", "");
      }
    }
    const skippedPreviews = Array.isArray(item.skipped_previews) ? item.skipped_previews as Array<Record<string, unknown>> : [];
    if (skippedPreviews.length > 0) {
      lines.push("#### Verworfen", "");
      for (const skipped of skippedPreviews) {
        lines.push(`- reason: ${String(skipped.reason ?? "unknown")}`);
        if (skipped.title) lines.push(`  - title: ${String(skipped.title)}`);
        if (skipped.source_url) lines.push(`  - source_url: ${String(skipped.source_url)}`);
        if (skipped.source_id) lines.push(`  - source_id: ${String(skipped.source_id)}`);
      }
      lines.push("");
    }
    const reason = item.reason ? String(item.reason) : null;
    if (reason) lines.push(`- reason: ${reason}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const summary: Array<Record<string, unknown>> = [];
  let failed = 0;
  for (const testCase of cases) {
    try {
      const item = await runCase(testCase);
      summary.push(item);
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.push({ ...makeBaseCaseRecord(testCase), ok: false, reason: message });
      console.error(`FAIL ${testCase.name}: ${message}`);
    }
  }
  const report = { ranAt: new Date().toISOString(), total: cases.length, failed, summary };
  mkdirSync(resultsDir, { recursive: true });
  const stamp = makeTimestampFilePart(report.ranAt);
  const stampedJsonPath = path.join(resultsDir, `jusline-live-check-${stamp}.json`);
  const latestJsonPath = path.join(resultsDir, "jusline-live-check.latest.json");
  const stampedMdPath = path.join(resultsDir, `jusline-live-check-${stamp}.md`);
  const latestMdPath = path.join(resultsDir, "jusline-live-check.latest.md");
  const reportJson = JSON.stringify(report, null, 2);
  const reportMd = renderMarkdown(report);
  writeFileSync(stampedJsonPath, reportJson, "utf8");
  writeFileSync(latestJsonPath, reportJson, "utf8");
  writeFileSync(stampedMdPath, reportMd, "utf8");
  writeFileSync(latestMdPath, reportMd, "utf8");
  console.log(reportJson);
  console.log(`wrote ${latestJsonPath}`);
  console.log(`wrote ${stampedJsonPath}`);
  console.log(`wrote ${latestMdPath}`);
  console.log(`wrote ${stampedMdPath}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
