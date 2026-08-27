import test from "node:test";
import assert from "node:assert/strict";
import {
  extractGeschaeftszahl,
  extractRechtssatznummer,
  extractCourt,
  extractDecisionDate,
  extractEcli,
  extractFundstellen,
  extractSchlagworte,
  splitNormLines,
  parseDecisionEntriesFromListHtml,
  fetchDecisionDetailPreview,
  hasUsefulDecisionDetail,
} from "../src/jusline/decision-detail.js";
import { takeHtmlAfterStrongLabel, takeTextAfterStrongLabel } from "../src/jusline/common.js";

test("extractGeschaeftszahl extracts Austrian court case numbers reliably", () => {
  // OGH
  assert.equal(extractGeschaeftszahl("Entscheidung vom 9.9.2008", "TE OGH 2008/9/9 5Ob121/08t"), "5Ob121/08t");
  assert.equal(extractGeschaeftszahl("Urteil 1 Ob 23/15k", "OGH 2015/06/15"), "1Ob23/15k");
  assert.equal(extractGeschaeftszahl("Strafsache 9 Os 12/21p"), "9Os12/21p");
  assert.equal(extractGeschaeftszahl("Arbeitsrecht 8 ObA 45/22h"), "8ObA45/22h");
  assert.equal(extractGeschaeftszahl("Sozialrecht 7 ObS 12/23m"), "7ObS12/23m");

  // VwGH
  assert.equal(extractGeschaeftszahl("Erkenntnis Ra 2021/05/0123"), "Ra 2021/05/0123");
  assert.equal(extractGeschaeftszahl("VwGH 2008/05/0123 vom 12.11.2008"), "2008/05/0123");

  // VfGH
  assert.equal(extractGeschaeftszahl("Erkenntnis G 12/2023 vom 15.03.2023"), "G 12/2023");
  assert.equal(extractGeschaeftszahl("Verordnungsprüfung V 45/2022"), "V 45/2022");
  assert.equal(extractGeschaeftszahl("Beschwerde B 123/2012"), "B 123/2012");

  // BVwG / LVwG
  assert.equal(extractGeschaeftszahl("BVwG W123 2123456-1"), "W123 2123456-1");
  assert.equal(extractGeschaeftszahl("LVwG LVwG-AV-123/001-2022"), "LVwG-AV-123/001-2022");
});

test("extractRechtssatznummer extracts OGH RS-Nummer", () => {
  assert.equal(extractRechtssatznummer("Rechtssatz RS0012345 zum Mietrecht"), "RS0012345");
  assert.equal(extractRechtssatznummer("Vgl auch RS0123456"), "RS0123456");
  assert.equal(extractRechtssatznummer("Keine RS-Nummer vorhanden"), undefined);
});

test("extractCourt identifies court types", () => {
  assert.equal(extractCourt("Entscheidung des OGH vom 09.09.2008"), "OGH");
  assert.equal(extractCourt("VwGH Ra 2021/05/0123"), "VwGH");
  assert.equal(extractCourt("VfGH G 12/2023"), "VfGH");
  assert.equal(extractCourt("BVwG W123 2123456-1"), "BVwG");
  assert.equal(extractCourt("LG für ZRS Wien als Berufungsgericht"), "LG für ZRS Wien");
});

test("extractDecisionDate parses various Austrian date notations", () => {
  const d1 = extractDecisionDate("Entscheidung", "TE OGH 2008/9/9 5Ob121/08t");
  assert.equal(d1.iso, "2008-09-09");
  assert.equal(d1.raw, "09.09.2008");

  const d2 = extractDecisionDate("Beschluss vom 15.03.2023 zu G 12/2023");
  assert.equal(d2.iso, "2023-03-15");
  assert.equal(d2.raw, "15.03.2023");
});

test("extractEcli matches direct and anchor ECLI structures", () => {
  const html = `<div><p>ECLI:AT:OGH0002:2008:0050OB00121.08T.0909.000</p></div>`;
  assert.equal(extractEcli(html), "ECLI:AT:OGH0002:2008:0050OB00121.08T.0909.000");

  const legacyAnchorHtml = `
    <p><strong>European Case Law Identifier (ECLI)</strong></p>
    ECLI:AT:OGH0002:2008: <a href="#">0050OB00121.08T.0909.000</a>
  `;
  assert.equal(extractEcli(legacyAnchorHtml), "ECLI:AT:OGH0002:2008:0050OB00121.08T.0909.000");
});

test("extractFundstellen extracts standard Austrian law journal citations", () => {
  const text = "Veröffentlicht in SZ 2008/123, EvBl 2009/45 und wobl 2009/12 sowie MietSlg 60.123.";
  const fundstellen = extractFundstellen("", text);
  assert.ok(fundstellen?.includes("SZ 2008/123"));
  assert.ok(fundstellen?.includes("EvBl 2009/45"));
  assert.ok(fundstellen?.includes("wobl 2009/12"));
});

test("takeHtmlAfterStrongLabel and takeTextAfterStrongLabel support flexible heading structures", () => {
  const htmlHeading = `
    <div class="card">
      <h3>Rechtssatz</h3>
      <p>Der Mieter kann bei Erhaltungsarbeiten die Minderung begehren.</p>
      <h3>Spruch</h3>
      <p>Der Revision wird Folge gegeben.</p>
    </div>
  `;
  assert.equal(takeTextAfterStrongLabel(htmlHeading, "Rechtssatz")?.includes("Minderung begehren"), true);
  assert.equal(takeTextAfterStrongLabel(htmlHeading, "Spruch")?.includes("Folge gegeben"), true);
});

test("splitNormLines parses multi-norm references", () => {
  const input = "MRG § 2; ABGB § 1096; WEG § 16";
  const norms = splitNormLines(input);
  assert.ok(norms && norms.length >= 2);
  assert.ok(norms.some((n) => n.includes("MRG") && n.includes("§ 2")));
  assert.ok(norms.some((n) => n.includes("ABGB") && n.includes("§ 1096")));
});

test("parseDecisionEntriesFromListHtml extracts GZ from list item", () => {
  const listHtml = `
    <div class="list-group-item">
      <a href="/entscheidung/275153"><h3>TE OGH 2008/9/9 5Ob121/08t<i class="fa fa-link"></i></h3></a>
      <p class="small"><span>Rechtssatz:</span> Erhaltungsarbeiten im MRG... <a href="/entscheidung/275153">mehr lesen...</a></p>
      <div><i class="fa-legal"></i> Entscheidung | <i class="fa-info-circle"></i> OGH | <i class="fa-clock-o"></i> 09.09.2008</div>
      <hr>
    </div>
  `;
  const entries = parseDecisionEntriesFromListHtml(listHtml, 5);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.source_id, "275153");
  assert.equal(entries[0]?.geschaeftszahl, "5Ob121/08t");
  assert.equal(entries[0]?.court, "OGH");
  assert.equal(entries[0]?.published_date_raw, "09.09.2008");
});

console.log("jusline decision detail tests passed");
