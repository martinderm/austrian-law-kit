import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { configureCacheRoot } from "../src/cache/cache-runtime.ts";
import { parseRisSearchHtml } from "../src/ris/search-parser.ts";
import { looksLikeRisNotFound, parseRisSegmentHtml } from "../src/ris/segment-parser.ts";
import { parseRisSegmentXml } from "../src/ris/segment-xml-parser.ts";
import { looksLikeRisWholeLawNotFound, parseRisWholeLawHtml } from "../src/ris/whole-law-parser.ts";
import { looksLikeJuslineNoDiscussions, parseJuslineDiscussionsHtml } from "../src/jusline/discussions-parser.ts";
import { looksLikeJuslineNoDecisions, parseJuslineDecisionsHtml } from "../src/jusline/decisions-parser.ts";
import { buildDisplayTitle, risFetchSegmentStub } from "../src/tools/ris_fetch_segment.ts";

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

async function testAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

async function withTempCacheRoot<T>(fn: () => Promise<T>): Promise<T> {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openclaw-law-parser-smoke-"));
  configureCacheRoot(tempRoot);
  try {
    return await fn();
  } finally {
    configureCacheRoot(undefined);
    rmSync(tempRoot, { recursive: true, force: true });
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
  assert.ok(parsed.normStatus === "in_force" || parsed.normStatus === "current");
  assert.equal(parsed.effectiveDateRaw, "01.06.2019");
  assert.equal(parsed.effectiveDate, "2019-06-01");
  assert.equal(parsed.indexLabel, "90/01 Straßenverkehrsrecht");
  assert.ok(parsed.promulgation?.includes("BGBl. Nr. 159/1960"));
  assert.equal(parsed.segmentRef, "§ 4");
  assert.equal(parsed.heading, "§ 4. Verkehrsunfälle.");
  assert.ok(parsed.content.startsWith("## § 4. Verkehrsunfälle."));
  assert.equal(parsed.content.includes("(2)"), true);
  assert.equal(parsed.content.includes("Absatz 2"), false);
  assert.match(parsed.content, /\(1\)Alle Personen, deren Verhalten am Unfallsort[\s\S]*?\n- a\) wenn sie ein Fahrzeug lenken, sofort anzuhalten,/);
  assert.match(parsed.content, /mitzuwirken\.\n+\(2\)Sind bei einem Verkehrsunfall Personen verletzt worden/);
  assert.match(parsed.content, /\n+\(5a\)Wenn nach einem Verkehrsunfall/);
  assert.match(parsed.content, /\n+\(6\)Aus einer Verletzung der Hilfeleistungspflicht/);
});

test("RIS segment parser marks repealed ABGB segment as repealed", () => {
  const html = fixture("fixtures/ris/nor12018853-live.html");
  const parsed = parseRisSegmentHtml(html);

  assert.equal(parsed.lawAbbreviation, "ABGB");
  assert.equal(parsed.segmentRef, "§ 1124");
  assert.equal(parsed.normStatus, "repealed");
  assert.ok(parsed.promulgation?.includes("aufgehoben"));
});

test("RIS segment parser fixes common mojibake patterns", () => {
  const html = fixture("fixtures/ris/nor40214078-live.html");
  const parsed = parseRisSegmentHtml(html);

  assert.equal(parsed.lawTitle, "Straßenverkehrsordnung 1960");
  assert.equal(parsed.heading, "§ 4. Verkehrsunfälle.");
  assert.ok(parsed.content.includes("Straßenzustand"));
  assert.equal(parsed.content.includes("Stra�Yenzustand"), false);
  assert.equal(parsed.content.includes("��"), false);
});

test("RIS segment parser promotes orphan heading lines before paragraph markers", () => {
  const html = `
    <!doctype html>
    <html lang="de">
      <head><title>ABGB § 237 - RIS</title></head>
      <body>
        <div id="x_TextContainer_y" class="p embeddedContent">
          <h3>Text</h3>
          <div>
            <p>Caution.</p>
            <p>§ 237. Der Vormund ist bei Antretung der Vormundschaft nicht schuldig, Caution zu leisten.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const parsed = parseRisSegmentHtml(html);

  assert.match(parsed.content, /^## Caution\.\n## § 237\./);
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

test("RIS segment XML parser keeps every top-level list in document order (#2)", () => {
  const xml = fixture("fixtures/ris/nor40258475-segment.xml");
  const parsed = parseRisSegmentXml(xml);

  assert.ok(parsed.content.includes("## Start-Up-Mitarbeiterbeteiligung"));
  assert.ok(parsed.content.includes("Der Arbeitgeber oder ein Gesellschafter des Arbeitgebers gewährt"));
  assert.ok(parsed.content.includes("soweit der Arbeitnehmer die Anteile veräußert"));
  assert.ok(parsed.content.includes("Der geldwerte Vorteil aus der unentgeltlichen Abgabe bemisst sich"));
  assert.ok(parsed.content.includes("zu 75% mit einem festen Satz von 27,5%"));
  assert.ok(parsed.content.includes("Der Wert gemäß lit.\u00a0b ist bei Vorliegen eines nicht zwölf Kalendermonate umfassenden Wirtschaftsjahres zu aliquotieren."));
  assert.ok(parsed.content.includes("und ist um Zahlungen gemäß Abs.\u00a02 Z\u00a01 zu vermindern."));
  assert.ok(parsed.content.includes("  - a)"));
  assert.ok(parsed.content.includes("  - d)"));

  const markers = [
    "(2) Eine Start",
    "Der Arbeitgeber oder ein Gesellschafter des Arbeitgebers gewährt",
    "(3) Der geldwerte Vorteil",
    "soweit der Arbeitnehmer die Anteile veräußert",
    "(4) Für die Besteuerung",
    "Der geldwerte Vorteil aus der unentgeltlichen Abgabe bemisst sich",
    "(5) Die auf die Start",
  ];
  const indices = markers.map((marker) => parsed.content.indexOf(marker));
  for (const index of indices) assert.ok(index >= 0, "expected marker in parsed content");
  for (let i = 1; i < indices.length; i += 1) {
    assert.ok(indices[i]! > indices[i - 1]!, `document order broken near ${markers[i]}`);
  }
});

test("RIS segment XML parser renders alternating paragraph and list blocks in order (#2)", () => {
  const xml = [
    '<risdok><abschnitt nr="1" typ="ns">',
    '<ueberschrift typ="titel" halign="j">Text</ueberschrift>',
    '<ueberschrift typ="para" ct="text" halign="c">Synthetische Bestimmung</ueberschrift>',
    '<absatz typ="abs" ct="text" halign="j"><gldsym>§ 1.</gldsym> (1) Erster Absatz.</absatz>',
    '<liste><aufzaehlung ebene="1" art="normal"><listelem ct="text"><symbol stellen="2">a)</symbol>Erster Listenpunkt</listelem></aufzaehlung></liste>',
    '<absatz typ="abs" ct="text" halign="j">(2) Zweiter Absatz.</absatz>',
    '<liste><aufzaehlung ebene="1" art="normal"><listelem ct="text"><symbol stellen="2">b)</symbol>Zweiter Listenpunkt</listelem></aufzaehlung>',
    '<aufzaehlung ebene="2" art="normal"><listelem ct="text"><symbol stellen="2">c)</symbol>Verschachtelter Punkt</listelem></aufzaehlung></liste>',
    '<absatz typ="abs" ct="text" halign="j">(3) Dritter Absatz.</absatz>',
    '<schlussteil ebene="1" art="normal" ct="text">Top-Level-Schlussteil.</schlussteil>',
    '</abschnitt></risdok>',
  ].join("");

  const parsed = parseRisSegmentXml(xml);
  const markers = [
    "## Synthetische Bestimmung",
    "(1) Erster Absatz.",
    "Erster Listenpunkt",
    "(2) Zweiter Absatz.",
    "Zweiter Listenpunkt",
    "Verschachtelter Punkt",
    "(3) Dritter Absatz.",
    "Top-Level-Schlussteil.",
  ];
  const indices = markers.map((marker) => parsed.content.indexOf(marker));
  for (const index of indices) assert.ok(index >= 0, "expected marker in parsed content");
  for (let i = 1; i < indices.length; i += 1) {
    assert.ok(indices[i]! > indices[i - 1]!, `document order broken near ${markers[i]}`);
  }
  assert.ok(parsed.content.includes("  - c) Verschachtelter Punkt"));
});

test("RIS segment XML parser fails loudly on unclassifiable top-level blocks (#2)", () => {
  const xml = [
    '<risdok><abschnitt nr="1" typ="ns">',
    '<ueberschrift typ="titel" halign="j">Text</ueberschrift>',
    '<absatz typ="abs" ct="text" halign="j">(1) Inhalt.</absatz>',
    "<tabelle><zeile>nicht klassifizierbar</zeile></tabelle>",
    '<absatz typ="abs" ct="text" halign="j">(2) Weiterer Inhalt.</absatz>',
    "</abschnitt></risdok>",
  ].join("");

  assert.throws(() => parseRisSegmentXml(xml), /Unclassified top-level block/);
});

test("RIS segment XML parser tolerates void layout elements without dropping content (#2)", () => {
  const xml = [
    '<risdok><abschnitt nr="1" typ="ns">',
    '<ueberschrift typ="titel" halign="j">Text</ueberschrift>',
    '<absatz typ="abs" ct="text" halign="j">(1) Vor dem Abstand.</absatz>',
    '<abstand ct="text" halign="l" />',
    '<absatz typ="abs" ct="text" halign="j">(2) Nach dem Abstand.</absatz>',
    "</abschnitt></risdok>",
  ].join("");
  const parsed = parseRisSegmentXml(xml);

  assert.ok(parsed.content.includes("(1) Vor dem Abstand."));
  assert.ok(parsed.content.includes("(2) Nach dem Abstand."));
});

test("RIS segment XML parser reads real ct=doknr and ct=gesnr metadata (#8)", () => {
  const xml = fixture("fixtures/ris/nor40258475-segment.xml");
  const parsed = parseRisSegmentXml(xml);

  assert.equal(parsed.dokumentnummer, "NOR40258475");
  assert.equal(parsed.gesetzesnummer, "10004570");
});

test("RIS segment XML parser reads short metadata CTs and prefers long CTs (#8)", () => {
  const minimal = [
    '<risdok><abschnitt nr="1" typ="ns">',
    '<absatz typ="erltext" ct="doknr" halign="j">NOR40258475</absatz>',
    '<absatz typ="erltext" ct="gesnr" halign="j">10004570</absatz>',
    '<ueberschrift typ="titel" halign="j">Text</ueberschrift>',
    '<absatz typ="abs" ct="text" halign="j">Minimaler Inhalt.</absatz>',
    "</abschnitt></risdok>",
  ].join("");
  const parsed = parseRisSegmentXml(minimal);
  assert.equal(parsed.dokumentnummer, "NOR40258475");
  assert.equal(parsed.gesetzesnummer, "10004570");

  const withLongCts = [
    '<risdok><abschnitt nr="1" typ="ns">',
    '<absatz typ="erltext" ct="dokumentnummer" halign="j">NOR99999999</absatz>',
    '<absatz typ="erltext" ct="doknr" halign="j">NOR40258475</absatz>',
    '<absatz typ="erltext" ct="gesetzesnummer" halign="j">99999999</absatz>',
    '<absatz typ="erltext" ct="gesnr" halign="j">10004570</absatz>',
    '<ueberschrift typ="titel" halign="j">Text</ueberschrift>',
    '<absatz typ="abs" ct="text" halign="j">Minimaler Inhalt.</absatz>',
    "</abschnitt></risdok>",
  ].join("");
  const preferred = parseRisSegmentXml(withLongCts);
  assert.equal(preferred.dokumentnummer, "NOR99999999");
  assert.equal(preferred.gesetzesnummer, "99999999");
});

test("RIS segment XML parser leaves absent metadata CTs undefined (#8)", () => {
  const xml = [
    '<risdok><abschnitt nr="1" typ="ns">',
    '<ueberschrift typ="titel" halign="j">Text</ueberschrift>',
    '<absatz typ="abs" ct="text" halign="j">Inhalt ohne Metadaten.</absatz>',
    "</abschnitt></risdok>",
  ].join("");
  const parsed = parseRisSegmentXml(xml);

  assert.equal(parsed.dokumentnummer, undefined);
  assert.equal(parsed.gesetzesnummer, undefined);
});

test("RIS segment XML parser keeps a future repeals date in force at the stichtag (#5)", () => {
  const xml = fixture("fixtures/ris/nor40269397-segment.xml");

  const current = parseRisSegmentXml(xml, { stichtag: "2026-09-30" });
  assert.equal(current.normStatus, "in_force");
  assert.equal(current.repealedDate, "2027-12-31");

  const lastValidDay = parseRisSegmentXml(xml, { stichtag: "2027-12-31" });
  assert.equal(lastValidDay.normStatus, "in_force");

  const afterRepeal = parseRisSegmentXml(xml, { stichtag: "2028-01-01" });
  assert.equal(afterRepeal.normStatus, "repealed");
});

test("RIS segment XML parser does not report a not-yet-effective norm as in force (#5)", () => {
  const xml = fixture("fixtures/ris/nor40269397-segment.xml");

  const beforeEffective = parseRisSegmentXml(xml, { stichtag: "2025-12-31" });
  assert.notEqual(beforeEffective.normStatus, "in_force");

  const firstDay = parseRisSegmentXml(xml, { stichtag: "2026-01-01" });
  assert.equal(firstDay.normStatus, "in_force");
});

test("display title omits the historic suffix for in-force norms (#5)", () => {
  const inForce = buildDisplayTitle({
    segmentRef: "§ 24",
    lawAbbreviation: "KStG 1988",
    lawTitle: "Körperschaftsteuergesetz 1988",
    heading: "§ 24. Erhebung der Steuer.",
    normStatus: "in_force",
    fallbackTitle: "RIS Dokument",
  });
  assert.equal(inForce.includes("historisch/aufgehoben"), false);

  const repealed = buildDisplayTitle({
    segmentRef: "§ 24",
    lawAbbreviation: "KStG 1988",
    lawTitle: "Körperschaftsteuergesetz 1988",
    heading: "§ 24. Erhebung der Steuer.",
    normStatus: "repealed",
    fallbackTitle: "RIS Dokument",
  });
  assert.equal(repealed.includes("historisch/aufgehoben"), true);
});

test("RIS segment HTML parser applies the stichtag to a future repeals date (#5)", () => {
  const html = `<!doctype html><html><head><title>KStG § 24 - RIS</title></head><body>
    <div class="contentBlock"><h1 class="Titel">Kurztitel</h1>Körperschaftsteuergesetz 1988</div>
    <div class="contentBlock"><h1 class="Titel">Abkürzung</h1>KStG 1988</div>
    <div class="contentBlock"><h1 class="Titel">§/Artikel/Anlage</h1>§ 24</div>
    <div class="contentBlock"><h1 class="Titel">Inkrafttretensdatum</h1>01.01.2026</div>
    <div class="contentBlock"><h1 class="Titel">Außerkrafttretensdatum</h1>31.12.2027</div>
    <div class="documentContent"><p>Die Körperschaftsteuer wird nach Ablauf des Kalenderjahres veranlagt.</p></div>
  </body></html>`;

  const current = parseRisSegmentHtml(html, { stichtag: "2026-09-30" });
  assert.equal(current.normStatus, "in_force");
  assert.equal(current.repealedDate, "2027-12-31");

  const afterRepeal = parseRisSegmentHtml(html, { stichtag: "2028-01-01" });
  assert.equal(afterRepeal.normStatus, "repealed");
});

await testAsync("ris_fetch_segment normalizes single-digit DD.MM.YYYY stichtag on its XML and HTML fresh paths (#5)", async () => {
  const xml = fixture("fixtures/ris/nor40269397-segment.xml");
  const html = `<!doctype html><html><head><title>TestG § 1 - RIS</title></head><body>
    <div class="contentBlock"><h1 class="Titel">Kurztitel</h1>Testgesetz</div>
    <div class="contentBlock"><h1 class="Titel">Abkürzung</h1>TestG</div>
    <div class="contentBlock"><h1 class="Titel">§/Artikel/Anlage</h1>§ 1</div>
    <div class="contentBlock"><h1 class="Titel">Inkrafttretensdatum</h1>01.01.2026</div>
    <div class="contentBlock"><h1 class="Titel">Außerkrafttretensdatum</h1>31.12.2027</div>
    <div class="contentBlock"><h1 class="Titel">Kundmachungsorgan</h1>BGBl. I Nr. 1/2026</div>
    <div class="documentContent"><p>Testnormtext für die Stichtag-Normalisierung.</p></div>
  </body></html>`;
  const xmlUrl = "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40269397/NOR40269397.xml";
  const htmlUrl = "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NORTESTSTICHTAG/NORTESTSTICHTAG.html";

  const originalFetch = globalThis.fetch;
  await withTempCacheRoot(async () => {
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith(".xml")) {
        return new Response(xml, { status: 200, headers: { "content-type": "application/xml" } });
      }
      return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
    }) as typeof fetch;

    try {
      const xmlSingle = await risFetchSegmentStub({ sourceId: "NOR40269397", contentUrl: xmlUrl, stichtag: "1.1.2028", refresh: true });
      assert.equal(xmlSingle.success, true);
      if (!xmlSingle.success) return;
      assert.equal(xmlSingle.data.artifact.frontmatter.norm_status, "repealed");
      assert.equal(xmlSingle.data.receipt?.norm_status, "repealed");
      assert.equal(xmlSingle.data.artifact.frontmatter.title?.includes("(historisch/aufgehoben)"), true);

      const xmlPadded = await risFetchSegmentStub({ sourceId: "NOR40269397", contentUrl: xmlUrl, stichtag: "01.01.2028", refresh: true });
      assert.equal(xmlPadded.success, true);
      if (!xmlPadded.success) return;
      assert.equal(xmlSingle.data.artifact.frontmatter.norm_status, xmlPadded.data.artifact.frontmatter.norm_status);

      const htmlSingle = await risFetchSegmentStub({ sourceId: "NORTESTSTICHTAG", contentUrl: htmlUrl, stichtag: "1.1.2028", refresh: true });
      assert.equal(htmlSingle.success, true);
      if (!htmlSingle.success) return;
      assert.equal(htmlSingle.data.artifact.frontmatter.norm_status, "repealed");
      assert.equal(htmlSingle.data.receipt?.norm_status, "repealed");
      assert.equal(htmlSingle.data.artifact.frontmatter.title?.includes("(historisch/aufgehoben)"), true);

      const htmlPadded = await risFetchSegmentStub({ sourceId: "NORTESTSTICHTAG", contentUrl: htmlUrl, stichtag: "01.01.2028", refresh: true });
      assert.equal(htmlPadded.success, true);
      if (!htmlPadded.success) return;
      assert.equal(htmlSingle.data.artifact.frontmatter.norm_status, htmlPadded.data.artifact.frontmatter.norm_status);
      assert.equal(xmlSingle.data.artifact.frontmatter.norm_status, htmlSingle.data.artifact.frontmatter.norm_status);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

console.log("parser smoke tests passed");
