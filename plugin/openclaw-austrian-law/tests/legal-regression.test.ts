import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { configureCacheRoot } from "../src/cache/cache-runtime.js";
import { risFetchSegmentStub } from "../src/tools/ris_fetch_segment.js";
import { risFetchWholeLawStub } from "../src/tools/ris_fetch_whole_law.js";
import { risSyncLawsStub } from "../src/tools/ris_sync_laws.js";
import { risSearchStub } from "../src/tools/ris_search.js";
import { formatLegalReviewMarkdown } from "../src/tools/format-result.js";
import {
  buildVerificationReceipt,
  getViennaTodayDate,
  validateStichtag,
} from "../src/ris/verification-receipt.js";

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
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openclaw-law-legal-reg-"));
  configureCacheRoot(tempRoot);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      configureCacheRoot(undefined);
      rmSync(tempRoot, { recursive: true, force: true });
    });
}

// ============================================================================

await test("Legal Regression: normalized hashes are representation-neutral while raw hashes retain provenance", () => {
  const common = {
    sourceId: "NOR40274264",
    paragraf: "§ 6",
    retrievalMethod: "norm_document_url" as const,
    stichtag: "2026-08-28",
    effectiveFrom: "2025-01-01",
    normStatus: "in_force" as const,
  };
  const htmlReceipt = buildVerificationReceipt({
    ...common,
    rawContent: "<p>(1) Vertragsbestimmungen sind nicht verbindlich.</p>",
    content: "(1)Vertragsbestimmungen sind nicht verbindlich.",
  });
  const xmlReceipt = buildVerificationReceipt({
    ...common,
    rawContent: "<absatz nummer=\"1\">Vertragsbestimmungen sind nicht verbindlich.</absatz>",
    content: "## Unzulässige Vertragsbestandteile\n\n(1)  Vertragsbestimmungen sind nicht verbindlich.",
  });

  assert.notEqual(htmlReceipt.raw_content_sha256, xmlReceipt.raw_content_sha256);
  assert.equal(htmlReceipt.normalized_content_sha256, xmlReceipt.normalized_content_sha256);

  const changedLegalStructureReceipt = buildVerificationReceipt({
    ...common,
    content: "(1) Vertragsbestimmungen sind nicht verbindlich.\n\n## Zusätzliche Zwischenüberschrift",
  });
  assert.notEqual(
    htmlReceipt.normalized_content_sha256,
    changedLegalStructureReceipt.normalized_content_sha256,
  );
});

// VERIFIED AUSTRIAN LEGAL REGRESSION SUITE (B)
// Primary Source: Rechtsinformationssystem des Bundes (RIS - ris.bka.gv.at)
// Reference Date / Stichtag Context: Europe/Vienna
// ============================================================================

// 1. MRG § 29 (Mietrechtsgesetz, Gesetzesnummer: 10002531, StF: BGBl. Nr. 520/1981)
// Befristungsregelung idF BGBl. I Nr. 114/2025 mit Wirkung ab 01.01.2026 (NOR40273695)
await test("Legal Regression: MRG § 29 (NOR40273695) ab 01.01.2026 Befristungsvarianten", async () => {
  const mrg29Html = `<!doctype html>
  <html lang="de">
  <head>
    <title>RIS - Mietrechtsgesetz § 29 - Bundesrecht konsolidiert, Fassung vom 27.08.2026</title>
  </head>
  <body>
    <div id="main">
      <h1>Bundesrecht konsolidiert: Gesamte Rechtsvorschrift für Mietrechtsgesetz, Fassung vom 27.08.2026</h1>
      <div class="contentBlock"><h3 class="Titel">Kurztitel</h3>Mietrechtsgesetz</div>
      <div class="contentBlock"><h3 class="Titel">Kundmachungsorgan</h3>BGBl. Nr. 520/1981 zuletzt geändert durch BGBl. I Nr. 114/2025</div>
      <div class="contentBlock"><h3 class="Titel">Typ</h3>BG</div>
      <div class="contentBlock"><h3 class="Titel">§/Artikel/Anlage</h3>§ 29</div>
      <div class="contentBlock"><h3 class="Titel">Inkrafttretensdatum</h3>01.01.2026</div>
      <div class="contentBlock"><h3 class="Titel">Abkürzung</h3>MRG</div>
      <div class="contentBlock"><h3 class="Titel">Fassung vom</h3>27.08.2026</div>
      <div class="contentBlock"><h3 class="Titel">Gesetzesnummer</h3>10002531</div>
      <div class="contentBlock"><h3 class="Titel">Dokumentnummer</h3>NOR40273695</div>
      <div class="contentBlock"><h3 class="Titel">ELI</h3>https://www.ris.bka.gv.at/eli/bgbl/1981/520/P29/NOR40273695</div>
      <div class="documentContent">
        <h4 class="UeberschrPara">§ 29. Auflösung und Erneuerung des Mietvertrages; Zurückstellung des Mietgegenstandes</h4>
        <p>(1) Der Mietvertrag wird aufgelöst durch:</p>
        <p>1. den Untergang des Mietgegenstandes;</p>
        <p>2. den Ablauf der vereinbarten Mietzeit;</p>
        <p>3. die Kündigung; lit. b: bei Wohnungen Befristung auf mindestens drei Jahre;</p>
        <p>(2) Ein befristeter Haupt- oder Untermietvertrag kann schriftlich verlängert werden.</p>
        <p>(3) Im Teilanwendungsbereich gilt das Schriftlichkeitsgebot für Befristungsvereinbarungen uneingeschränkt.</p>
      </div>
    </div>
  </body>
  </html>`;

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(mrg29Html, { status: 200 }), async () => {
      // Test A: Verification at Stichtag 2026-08-27 (Valid in force)
      const resCurrent = await risFetchSegmentStub({
        sourceId: "NOR40273695",
        stichtag: "2026-08-27",
      });
      assert.equal(resCurrent.success, true);
      if (!resCurrent.success) return;
      const receipt = resCurrent.data.receipt!;
      assert.equal(receipt.source_id, "NOR40273695");
      assert.equal(receipt.gesetzesnummer, "10002531");
      assert.equal(receipt.dokumentnummer, "NOR40273695");
      assert.equal(receipt.eli, "https://www.ris.bka.gv.at/eli/bgbl/1981/520/P29/NOR40273695");
      assert.equal(receipt.paragraf, "§ 29");
      assert.equal(receipt.consolidated_as_of, "2026-08-27");
      assert.equal(receipt.effective_from, "2026-01-01");
      assert.equal(receipt.effective_to, null);
      assert.equal(receipt.retrieval_method, "direct_source_id");
      assert.equal(receipt.cached, false);
      assert.ok(receipt.raw_content_sha256.length === 64);
      assert.ok(receipt.normalized_content_sha256.length === 64);

      // Test B: Premature Stichtag (2025-12-31) -> fail-closed mismatch
      const resPremature = await risFetchSegmentStub({
        sourceId: "NOR40273695",
        stichtag: "2025-12-31",
      });
      assert.equal(resPremature.success, true);
      if (!resPremature.success) return;
      assert.equal(resPremature.data.receipt?.verification_status, "stichtag_mismatch");
      assert.ok(resPremature.data.receipt?.warning?.includes("not yet in force"));
    });
  });
});

// 2. MieWeG §§ 1, 2 und 4 (Mieten-Wertsicherungs-Begrenzungsgesetz / BGBl. I Nr. 154/2023, Inkrafttreten: 01.01.2024)
await test("Legal Regression: MieWeG §§ 1, 2 und 4 (NOR40258548, NOR40258549, NOR40258551)", async () => {
  const mieWeGMap: Record<string, string> = {
    NOR40258548: `<!doctype html><html><head><title>MieWeG § 1 - RIS</title></head><body>
      <div class="contentBlock"><h3>Kurztitel</h3>Mieten-Wertsicherungs-Begrenzungsgesetz</div>
      <div class="contentBlock"><h3>Abkürzung</h3>MieWeG</div>
      <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 1</div>
      <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2024</div>
      <div class="contentBlock"><h3>Kundmachungsorgan</h3>BGBl. I Nr. 154/2023</div>
      <div class="contentBlock"><h3>Gesetzesnummer</h3>20012543</div>
      <div class="contentBlock"><h3>Dokumentnummer</h3>NOR40258548</div>
      <div class="documentContent">
        <h4>§ 1. Gegenstand und Geltungsbereich</h4>
        <p>Dieses Bundesgesetz regelt die Begrenzung von Valorisierungen und Anpassungen gesetzlicher und vertraglicher Mietzinse.</p>
      </div>
    </body></html>`,
    NOR40258549: `<!doctype html><html><head><title>MieWeG § 2 - RIS</title></head><body>
      <div class="contentBlock"><h3>Kurztitel</h3>Mieten-Wertsicherungs-Begrenzungsgesetz</div>
      <div class="contentBlock"><h3>Abkürzung</h3>MieWeG</div>
      <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 2</div>
      <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2024</div>
      <div class="contentBlock"><h3>Kundmachungsorgan</h3>BGBl. I Nr. 154/2023</div>
      <div class="contentBlock"><h3>Gesetzesnummer</h3>20012543</div>
      <div class="contentBlock"><h3>Dokumentnummer</h3>NOR40258549</div>
      <div class="documentContent">
        <h4>§ 2. Begrenzung der Wertsicherung in den Kalenderjahren 2024 und 2025</h4>
        <p>In den Jahren 2024 und 2025 beträgt der Anpassungsfaktor höchstens 5 Prozent.</p>
      </div>
    </body></html>`,
    NOR40258551: `<!doctype html><html><head><title>MieWeG § 4 - RIS</title></head><body>
      <div class="contentBlock"><h3>Kurztitel</h3>Mieten-Wertsicherungs-Begrenzungsgesetz</div>
      <div class="contentBlock"><h3>Abkürzung</h3>MieWeG</div>
      <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 4</div>
      <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2024</div>
      <div class="contentBlock"><h3>Kundmachungsorgan</h3>BGBl. I Nr. 154/2023</div>
      <div class="contentBlock"><h3>Gesetzesnummer</h3>20012543</div>
      <div class="contentBlock"><h3>Dokumentnummer</h3>NOR40258551</div>
      <div class="documentContent">
        <h4>§ 4. Inkrafttreten und Vollziehung</h4>
        <p>Dieses Bundesgesetz tritt mit 1. Jänner 2024 in Kraft. Mit der Vollziehung ist die Bundesministerin für Justiz betraut.</p>
      </div>
    </body></html>`,
  };

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      for (const [docNo, html] of Object.entries(mieWeGMap)) {
        if (url.includes(docNo)) return new Response(html, { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    }, async () => {
      const syncResult = await risSyncLawsStub({
        laws: [
          { sourceId: "NOR40258548", paragraph: "§ 1", stichtag: "2024-06-01" },
          { sourceId: "NOR40258549", paragraph: "§ 2", stichtag: "2024-06-01" },
          { sourceId: "NOR40258551", paragraph: "§ 4", stichtag: "2024-06-01" },
        ],
      });

      assert.equal(syncResult.success, true);
      if (!syncResult.success) return;
      assert.equal(syncResult.data.total, 3);
      assert.equal(syncResult.data.synced, 3);
      assert.equal(syncResult.data.failed, 0);

      const p1 = syncResult.data.laws[0]!;
      assert.equal(p1.receipt?.gesetzesnummer, "20012543");
      assert.equal(p1.receipt?.dokumentnummer, "NOR40258548");
      assert.equal(p1.receipt?.effective_from, "2024-01-01");
      assert.equal(p1.receipt?.paragraf, "§ 1");

      const p2 = syncResult.data.laws[1]!;
      assert.equal(p2.receipt?.dokumentnummer, "NOR40258549");
      assert.equal(p2.receipt?.paragraf, "§ 2");

      const p4 = syncResult.data.laws[2]!;
      assert.equal(p4.receipt?.dokumentnummer, "NOR40258551");
      assert.equal(p4.receipt?.paragraf, "§ 4");
    });
  });
});

// 3. KSchG §§ 1 und 6 (Konsumentenschutzgesetz, Gesetzesnummer: 10002462, StF: BGBl. Nr. 140/1979)
await test("Legal Regression: KSchG §§ 1 und 6 (NOR12038753, NOR40242273)", async () => {
  const kschgMap: Record<string, string> = {
    NOR12038753: `<!doctype html><html><head><title>KSchG § 1 - RIS</title></head><body>
      <div class="contentBlock"><h3>Kurztitel</h3>Konsumentenschutzgesetz</div>
      <div class="contentBlock"><h3>Abkürzung</h3>KSchG</div>
      <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 1</div>
      <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.10.1979</div>
      <div class="contentBlock"><h3>Kundmachungsorgan</h3>BGBl. Nr. 140/1979</div>
      <div class="contentBlock"><h3>Gesetzesnummer</h3>10002462</div>
      <div class="contentBlock"><h3>Dokumentnummer</h3>NOR12038753</div>
      <div class="documentContent">
        <h4>1. Hauptstück: Verbraucherverträge. 1. Abschnitt: Allgemeine Bestimmungen.</h4>
        <p>§ 1. (1) Dieses Hauptstück gilt für Rechtsgeschäfte, an denen einerseits ein Unternehmer und andererseits ein Verbraucher beteiligt sind.</p>
      </div>
    </body></html>`,
    NOR40242273: `<!doctype html><html><head><title>KSchG § 6 - RIS</title></head><body>
      <div class="contentBlock"><h3>Kurztitel</h3>Konsumentenschutzgesetz</div>
      <div class="contentBlock"><h3>Abkürzung</h3>KSchG</div>
      <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 6</div>
      <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2023</div>
      <div class="contentBlock"><h3>Kundmachungsorgan</h3>BGBl. Nr. 140/1979 zuletzt geändert durch BGBl. I Nr. 109/2022</div>
      <div class="contentBlock"><h3>Gesetzesnummer</h3>10002462</div>
      <div class="contentBlock"><h3>Dokumentnummer</h3>NOR40242273</div>
      <div class="documentContent">
        <h4>§ 6. Unzulässige Vertragsbestandteile</h4>
        <p>(1) Für den Verbraucher sind besonders solche Vertragsbestimmungen im Sinn des § 879 ABGB unverbindlich, nach denen:</p>
        <p>1. sich der Unternehmer eine unangemessen lange oder nicht hinreichend bestimmte Frist vorbehält;</p>
      </div>
    </body></html>`,
  };

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      for (const [docNo, html] of Object.entries(kschgMap)) {
        if (url.includes(docNo)) return new Response(html, { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    }, async () => {
      const res = await risSyncLawsStub({
        laws: [
          { sourceId: "NOR12038753", paragraph: "§ 1" },
          { sourceId: "NOR40242273", paragraph: "§ 6" },
        ],
      });

      assert.equal(res.success, true);
      if (!res.success) return;
      assert.equal(res.data.total, 2);
      assert.equal(res.data.laws[0]?.receipt?.gesetzesnummer, "10002462");
      assert.equal(res.data.laws[0]?.receipt?.paragraf, "§ 1");
      assert.equal(res.data.laws[1]?.receipt?.gesetzesnummer, "10002462");
      assert.equal(res.data.laws[1]?.receipt?.paragraf, "§ 6");
    });
  });
});

// 4. ABGB §§ 1096, 1111, 1117 und 1118 (Allgemeines bürgerliches Gesetzbuch, Gesetzesnummer: 10001622, StF: JGS Nr. 946/1811)
await test("Legal Regression: ABGB §§ 1096, 1111, 1117 und 1118 (Bestandrecht)", async () => {
  const abgbNorms: Record<string, { pNum: number; heading: string; text: string }> = {
    NOR12019035: {
      pNum: 1096,
      heading: "§ 1096. Pflichten des Vermiethers und Verpächters",
      text: "Der Vermiether oder Verpächter ist verbunden, das Bestandstück auf eigene Kosten im brauchbaren Stande zu übergeben und zu erhalten.",
    },
    NOR12019050: {
      pNum: 1111,
      heading: "§ 1111. Ersatzansprüche bei Beendigung des Bestandvertrages",
      text: "Der Bestandgeber kann wegen Beschädigung oder übermäßiger Abnutzung der Bestandsache nur binnen einem Jahre nach Zurückstellung derselben Ersatz fordern.",
    },
    NOR12019056: {
      pNum: 1117,
      heading: "§ 1117. Vorzeitige Auflösung durch den Bestandnehmer",
      text: "Der Bestandnehmer ist berechtigt, auch vor Verlauf der bedungenen Zeit von dem Vertrage ohne Kündigung abzustehen, wenn das Bestandstück ohne seine Schuld zu dem bedungenen Gebrauche untauglich geworden ist.",
    },
    NOR12019057: {
      pNum: 1118,
      heading: "§ 1118. Vorzeitige Auflösung durch den Bestandgeber",
      text: "Der Bestandgeber kann die frühere Aufhebung des Vertrages fordern, wenn der Bestandnehmer von der Sache einen erheblich nachtheiligen Gebrauch macht oder mit Bezahlung des Zinses säumig ist.",
    },
  };

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      for (const [docNo, data] of Object.entries(abgbNorms)) {
        if (url.includes(docNo)) {
          const html = `<!doctype html><html><head><title>ABGB § ${data.pNum} - RIS</title></head><body>
            <div class="contentBlock"><h3>Kurztitel</h3>Allgemeines bürgerliches Gesetzbuch</div>
            <div class="contentBlock"><h3>Abkürzung</h3>ABGB</div>
            <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ ${data.pNum}</div>
            <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.1812</div>
            <div class="contentBlock"><h3>Kundmachungsorgan</h3>JGS Nr. 946/1811</div>
            <div class="contentBlock"><h3>Gesetzesnummer</h3>10001622</div>
            <div class="contentBlock"><h3>Dokumentnummer</h3>${docNo}</div>
            <div class="documentContent">
              <h4>${data.heading}</h4>
              <p>${data.text}</p>
            </div>
          </body></html>`;
          return new Response(html, { status: 200 });
        }
      }
      return new Response("Not Found", { status: 404 });
    }, async () => {
      const res = await risSyncLawsStub({
        laws: [
          { sourceId: "NOR12019035", paragraph: "§ 1096" },
          { sourceId: "NOR12019050", paragraph: "§ 1111" },
          { sourceId: "NOR12019056", paragraph: "§ 1117" },
          { sourceId: "NOR12019057", paragraph: "§ 1118" },
        ],
      });

      assert.equal(res.success, true);
      if (!res.success) return;
      assert.equal(res.data.total, 4);
      assert.equal(res.data.synced, 4);
      assert.equal(res.data.laws[0]?.receipt?.paragraf, "§ 1096");
      assert.equal(res.data.laws[1]?.receipt?.paragraf, "§ 1111");
      assert.equal(res.data.laws[2]?.receipt?.paragraf, "§ 1117");
      assert.equal(res.data.laws[3]?.receipt?.paragraf, "§ 1118");
      for (const item of res.data.laws) {
        assert.equal(item.receipt?.gesetzesnummer, "10001622");
        assert.equal(item.receipt?.effective_from, "1812-01-01");
      }
    });
  });
});

// 5. HeizKG-Gesamtfassung (Heizkostenabrechnungsgesetz, Gesetzesnummer: 10002894, StF: BGBl. Nr. 827/1992)
await test("Legal Regression: HeizKG-Gesamtfassung (Gesetzesnummer: 10002894)", async () => {
  const heizKgHtml = `<!doctype html>
  <html lang="de">
  <head>
    <title>RIS - Heizkostenabrechnungsgesetz - Bundesrecht konsolidiert, Fassung vom 27.08.2026</title>
  </head>
  <body>
    <div id="main">
      <h1 id="Title">Bundesrecht konsolidiert: Gesamte Rechtsvorschrift für Heizkostenabrechnungsgesetz, Fassung vom 27.08.2026</h1>
      <div id="documentContentBlocks">
        <div class="documentContent">
          <div class="p"><h3>Langtitel</h3>Bundesgesetz über die Aufteilung der Heiz- und Warmwasserkosten (Heizkostenabrechnungsgesetz - HeizKG)<br>StF: BGBl. Nr. 827/1992</div>
        </div>
        <div class="documentContent">
          <h2>§ 1. Gegenstand des Gesetzes</h2>
          <p>(1) Dieses Bundesgesetz regelt die Aufteilung und Abrechnung der Kosten der Wärme- und Warmwasserversorgung in Gebäuden mit mindestens vier Nutzungsobjekten.</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(heizKgHtml, { status: 200 }), async () => {
      const res = await risFetchWholeLawStub({
        wholeLawUrl: "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002894",
        stichtag: "2026-08-27",
      });

      assert.equal(res.success, true);
      if (!res.success) return;
      const receipt = res.data.receipt!;
      assert.equal(receipt.paragraf, "Gesamte Rechtsvorschrift");
      assert.equal(receipt.gesetzesnummer, "10002894");
      assert.equal(receipt.consolidated_as_of, "2026-08-27");
      assert.ok(receipt.raw_content_sha256.length === 64);
      assert.ok(receipt.normalized_content_sha256.length === 64);
      assert.equal(receipt.retrieval_method, "norm_document_url");
      assert.equal(res.data.artifact.frontmatter.representation, "whole_law");
    });
  });
});

// 6. Fail-Closed Stichtag Validation Tests
await test("Legal Regression: Fail-closed validation for invalid stichtag formats", async () => {
  const invalidDates = ["invalid-date", "2026-02-31", "2026-13-01", "32.01.2026", "2026/01/01"];
  for (const inv of invalidDates) {
    const resSegment = await risFetchSegmentStub({ sourceId: "NOR40273695", stichtag: inv });
    assert.equal(resSegment.success, false);
    if (!resSegment.success) {
      assert.equal(resSegment.error.code, "VALIDATION_ERROR");
      assert.ok(resSegment.error.message.includes("Invalid stichtag"));
    }

    const resWhole = await risFetchWholeLawStub({ sourceId: "NOR12032493", stichtag: inv });
    assert.equal(resWhole.success, false);
    if (!resWhole.success) {
      assert.equal(resWhole.error.code, "VALIDATION_ERROR");
    }

    const resSync = await risSyncLawsStub({ laws: [{ sourceId: "NOR12032493" }], stichtag: inv });
    assert.equal(resSync.success, false);
    if (!resSync.success) {
      assert.equal(resSync.error.code, "VALIDATION_ERROR");
    }
  }
});

// 7. Batch Deduplication with Multi-Attribute Key
await test("Legal Regression: Batch items with identical sourceId but different Stichtage are not collapsed", async () => {
  const normHtml = `<!doctype html><html><head><title>Test Norm</title></head><body>
    <div class="contentBlock"><h3>Kurztitel</h3>Testgesetz</div>
    <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 1</div>
    <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2026</div>
    <div class="contentBlock"><h3>Dokumentnummer</h3>NOR99999999</div>
    <div class="documentContent"><p>Inhalt</p></div>
  </body></html>`;

  await withTempCacheRoot(async () => {
    let fetchCount = 0;
    const viennaToday = getViennaTodayDate();
    await withMockedFetch(async () => {
      fetchCount++;
      return new Response(normHtml, { status: 200 });
    }, async () => {
      const res = await risSyncLawsStub({
        laws: [
          { sourceId: "NOR99999999", paragraph: "§ 1", stichtag: viennaToday },
          { sourceId: "NOR99999999", paragraph: "§ 1", stichtag: "2025-01-01" }, // Different Stichtag!
        ],
      });

      assert.equal(res.success, true);
      if (!res.success) return;
      assert.equal(res.data.total, 2);
      assert.equal(res.data.deduplicated, 0); // Must NOT be deduplicated!
      assert.equal(res.data.verified_current, 1);
      assert.equal(res.data.stichtag_mismatch, 1);
      assert.equal(res.data.failed, 1);
      assert.equal(res.data.laws[0]?.ok, true);
      assert.equal(res.data.laws[0]?.receipt?.verification_status, "verified_current");
      assert.equal(res.data.laws[1]?.ok, false);
      assert.equal(res.data.laws[1]?.receipt?.verification_status, "stichtag_mismatch"); // Not in force in 2025
    });
  });
});

// 8. MRG § 3 Stichtagsauflösung: NOR40167127 (in force) vs NOR12040713 (historical)
await test("Legal Regression: MRG § 3 resolves to in-force NOR40167127 on current stichtag", async () => {
  const viennaToday = getViennaTodayDate();
  const mrg3ApiResponse = {
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { "#text": "2", "@pageNumber": "1", "@pageSize": "10" },
        OgdDocumentReference: [
          {
            Data: {
              Metadaten: {
                Technisch: { ID: "NOR12040713", Applikation: "BrKons" },
                Allgemein: { DokumentUrl: "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=NOR12040713", Veroeffentlicht: "1982-01-01" },
                Bundesrecht: {
                  Kurztitel: "Mietrechtsgesetz",
                  BrKons: {
                    Gesetzesnummer: "10002531",
                    ArtikelParagraphAnlage: "§ 3",
                    Paragraphnummer: "3",
                    Inkrafttretedatum: "1982-01-01",
                    Ausserkrafttretedatum: "2014-12-31",
                    FassungVom: "2014-12-31",
                    Kundmachungsorgan: "BGBl. Nr. 520/1981 aufgehoben durch BGBl. I Nr. 100/2014",
                    Typ: "Historisch",
                  },
                },
              },
            },
          },
          {
            Data: {
              Metadaten: {
                Technisch: { ID: "NOR40167127", Applikation: "BrKons" },
                Allgemein: { DokumentUrl: "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=NOR40167127", Veroeffentlicht: "2015-01-01" },
                Bundesrecht: {
                  Kurztitel: "Mietrechtsgesetz",
                  BrKons: {
                    Gesetzesnummer: "10002531",
                    ArtikelParagraphAnlage: "§ 3",
                    Paragraphnummer: "3",
                    Inkrafttretedatum: "2015-01-01",
                    FassungVom: viennaToday,
                    Kundmachungsorgan: "BGBl. Nr. 520/1981 zuletzt geändert durch BGBl. I Nr. 100/2014",
                    Typ: "BG",
                  },
                },
              },
            },
          },
        ],
      },
    },
  };

  const nor40167127Html = `<!doctype html><html><head><title>MRG § 3</title></head><body>
    <div class="contentBlock"><h3>Kurztitel</h3>Mietrechtsgesetz</div>
    <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 3</div>
    <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2015</div>
    <div class="contentBlock"><h3>Fassung vom</h3>${viennaToday}</div>
    <div class="contentBlock"><h3>Dokumentnummer</h3>NOR40167127</div>
    <div class="documentContent"><p>§ 3. Erhaltung</p><p>(1) Der Vermieter hat das Mietobjekt zu erhalten.</p></div>
  </body></html>`;

  const nor12040713Html = `<!doctype html><html><head><title>MRG § 3 alt</title></head><body>
    <div class="contentBlock"><h3>Kurztitel</h3>Mietrechtsgesetz</div>
    <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 3</div>
    <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.1982</div>
    <div class="contentBlock"><h3>Außerkrafttretensdatum</h3>31.12.2014</div>
    <div class="contentBlock"><h3>Dokumentnummer</h3>NOR12040713</div>
    <div class="documentContent"><p>§ 3 alte Fassung</p></div>
  </body></html>`;

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/Bundesrecht") || urlStr.includes("api.ris.bka.gv.at")) {
        return new Response(JSON.stringify(mrg3ApiResponse), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (urlStr.includes("NOR40167127")) {
        return new Response(nor40167127Html, { status: 200 });
      }
      if (urlStr.includes("NOR12040713")) {
        return new Response(nor12040713Html, { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    }, async () => {
      // 1. Search Ranking test
      const searchRes = await risSearchStub({
        query: "MRG § 3",
        stichtag: viennaToday,
      });
      assert.equal(searchRes.success, true);
      if (!searchRes.success) return;
      assert.equal(searchRes.data.best_candidate?.source_id, "NOR40167127");
      assert.equal(searchRes.data.hits[0]?.source_id, "NOR40167127");
      assert.equal(searchRes.data.hits[0]?.verification_status, "verified_current");
      assert.equal(searchRes.data.hits[1]?.source_id, "NOR12040713");
      assert.equal(searchRes.data.hits[1]?.verification_status, "stichtag_mismatch");

      // 2. ris_sync_laws candidate resolution test
      const syncRes = await risSyncLawsStub({
        laws: [{ query: "MRG § 3", stichtag: viennaToday }],
      });
      assert.equal(syncRes.success, true);
      if (!syncRes.success) return;
      assert.equal(syncRes.data.total, 1);
      assert.equal(syncRes.data.synced, 1);
      assert.equal(syncRes.data.failed, 0);
      assert.equal(syncRes.data.verified_current, 1);
      assert.equal(syncRes.data.laws[0]?.source_id, "NOR40167127");
      assert.equal(syncRes.data.laws[0]?.ok, true);
      assert.equal(syncRes.data.laws[0]?.receipt?.verification_status, "verified_current");
    });
  });
});

// 9. KSchG § 6 Stichtagsauflösung: NOR40274264 (in force) vs NOR40045312 (historical)
await test("Legal Regression: KSchG § 6 resolves to in-force NOR40274264 on current stichtag", async () => {
  const viennaToday = getViennaTodayDate();
  const kschg6ApiResponse = {
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { "#text": "3", "@pageNumber": "1", "@pageSize": "10" },
        OgdDocumentReference: [
          {
            Data: {
              Metadaten: {
                Technisch: { ID: "NOR40045312", Applikation: "BrKons" },
                Allgemein: { DokumentUrl: "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=NOR40045312" },
                Bundesrecht: {
                  Kurztitel: "Konsumentenschutzgesetz",
                  BrKons: {
                    Gesetzesnummer: "10002462",
                    ArtikelParagraphAnlage: "§ 6",
                    Paragraphnummer: "6",
                    Inkrafttretedatum: "1979-10-01",
                    Ausserkrafttretedatum: "2024-12-31",
                    FassungVom: "2024-12-31",
                    Typ: "Historisch",
                  },
                },
              },
            },
          },
          {
            Data: {
              Metadaten: {
                Technisch: { ID: "NOR40148651", Applikation: "BrKons" },
                Allgemein: { DokumentUrl: "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=NOR40148651" },
                Bundesrecht: {
                  Kurztitel: "Konsumentenschutzgesetz",
                  BrKons: {
                    Gesetzesnummer: "10002462",
                    ArtikelParagraphAnlage: "§ 6a",
                    Paragraphnummer: "6",
                    Inkrafttretedatum: "2010-06-11",
                    FassungVom: viennaToday,
                    Typ: "BG",
                  },
                },
              },
            },
          },
          {
            Data: {
              Metadaten: {
                Technisch: { ID: "NOR40274264", Applikation: "BrKons" },
                Allgemein: { DokumentUrl: "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=NOR40274264" },
                Bundesrecht: {
                  Kurztitel: "Konsumentenschutzgesetz",
                  BrKons: {
                    Gesetzesnummer: "10002462",
                    ArtikelParagraphAnlage: "§ 6",
                    Paragraphnummer: "6",
                    Inkrafttretedatum: "2025-01-01",
                    FassungVom: viennaToday,
                    Typ: "BG",
                  },
                },
              },
            },
          },
        ],
      },
    },
  };

  const nor40274264Html = `<!doctype html><html><head><title>KSchG § 6</title></head><body>
    <div class="contentBlock"><h3>Kurztitel</h3>Konsumentenschutzgesetz</div>
    <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 6</div>
    <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2025</div>
    <div class="contentBlock"><h3>Fassung vom</h3>${viennaToday}</div>
    <div class="contentBlock"><h3>Dokumentnummer</h3>NOR40274264</div>
    <div class="documentContent"><p>§ 6. Unzulässige Vertragsbestandteile</p></div>
  </body></html>`;

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/Bundesrecht") || urlStr.includes("api.ris.bka.gv.at")) {
        return new Response(JSON.stringify(kschg6ApiResponse), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (urlStr.includes("NOR40274264")) {
        return new Response(nor40274264Html, { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    }, async () => {
      const searchRes = await risSearchStub({
        query: "KSchG § 6",
        stichtag: viennaToday,
      });
      assert.equal(searchRes.success, true);
      if (!searchRes.success) return;
      assert.ok(searchRes.data.hits.length > 0);
      assert.ok(searchRes.data.hits.every((hit) => hit.paragraph_number === "6"));
      assert.ok(searchRes.data.hits.every((hit) => hit.source_id !== "NOR40148651"));

      const syncRes = await risSyncLawsStub({
        laws: [{ query: "KSchG § 6", stichtag: viennaToday }],
      });
      assert.equal(syncRes.success, true);
      if (!syncRes.success) return;
      assert.equal(syncRes.data.total, 1);
      assert.equal(syncRes.data.verified_current, 1);
      assert.equal(syncRes.data.laws[0]?.source_id, "NOR40274264");
      assert.equal(syncRes.data.laws[0]?.ok, true);
    });
  });
});

// 10. Mixed Batch with Current and Historical Stichtage for the same norm
await test("Legal Regression: Mixed batch with current and historical stichtag resolves distinct versions", async () => {
  const viennaToday = getViennaTodayDate();
  const mrg3ApiResponse = {
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { "#text": "2", "@pageNumber": "1", "@pageSize": "10" },
        OgdDocumentReference: [
          {
            Data: {
              Metadaten: {
                Technisch: { ID: "NOR12040713", Applikation: "BrKons" },
                Allgemein: { DokumentUrl: "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=NOR12040713" },
                Bundesrecht: {
                  Kurztitel: "Mietrechtsgesetz",
                  BrKons: {
                    Gesetzesnummer: "10002531",
                    ArtikelParagraphAnlage: "§ 3",
                    Paragraphnummer: "3",
                    Inkrafttretedatum: "1982-01-01",
                    Ausserkrafttretedatum: "2014-12-31",
                    FassungVom: "2014-12-31",
                  },
                },
              },
            },
          },
          {
            Data: {
              Metadaten: {
                Technisch: { ID: "NOR40167127", Applikation: "BrKons" },
                Allgemein: { DokumentUrl: "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=NOR40167127" },
                Bundesrecht: {
                  Kurztitel: "Mietrechtsgesetz",
                  BrKons: {
                    Gesetzesnummer: "10002531",
                    ArtikelParagraphAnlage: "§ 3",
                    Paragraphnummer: "3",
                    Inkrafttretedatum: "2015-01-01",
                    FassungVom: viennaToday,
                  },
                },
              },
            },
          },
        ],
      },
    },
  };

  const nor40167127Html = `<!doctype html><html><head><title>MRG § 3</title></head><body>
    <div class="contentBlock"><h3>Kurztitel</h3>Mietrechtsgesetz</div>
    <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 3</div>
    <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.2015</div>
    <div class="contentBlock"><h3>Dokumentnummer</h3>NOR40167127</div>
    <div class="documentContent"><p>§ 3 aktuelle Fassung</p></div>
  </body></html>`;

  const nor12040713Html = `<!doctype html><html><head><title>MRG § 3 alt</title></head><body>
    <div class="contentBlock"><h3>Kurztitel</h3>Mietrechtsgesetz</div>
    <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 3</div>
    <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.1982</div>
    <div class="contentBlock"><h3>Außerkrafttretensdatum</h3>31.12.2014</div>
    <div class="contentBlock"><h3>Dokumentnummer</h3>NOR12040713</div>
    <div class="documentContent"><p>§ 3 historische Fassung</p></div>
  </body></html>`;

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/Bundesrecht") || urlStr.includes("api.ris.bka.gv.at")) {
        return new Response(JSON.stringify(mrg3ApiResponse), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (urlStr.includes("NOR40167127")) {
        return new Response(nor40167127Html, { status: 200 });
      }
      if (urlStr.includes("NOR12040713")) {
        return new Response(nor12040713Html, { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    }, async () => {
      const syncRes = await risSyncLawsStub({
        laws: [
          { query: "MRG § 3", stichtag: viennaToday },
          { query: "MRG § 3", stichtag: "2000-01-01" },
        ],
      });

      assert.equal(syncRes.success, true);
      if (!syncRes.success) return;
      assert.equal(syncRes.data.total, 2);
      assert.equal(syncRes.data.verified_current, 1);
      assert.equal(syncRes.data.historical_valid_for_stichtag, 1);
      assert.equal(syncRes.data.failed, 0);
      assert.equal(syncRes.data.laws[0]?.source_id, "NOR40167127");
      assert.equal(syncRes.data.laws[0]?.receipt?.verification_status, "verified_current");
      assert.equal(syncRes.data.laws[1]?.source_id, "NOR12040713");
      assert.equal(syncRes.data.laws[1]?.receipt?.verification_status, "historical_valid_for_stichtag");
    });
  });
});

// 11. Fail-closed batch for stichtag mismatch and network error diagnostic details
await test("Legal Regression: Fail-closed batch for stichtag mismatch & detailed network error diagnostics", async () => {
  const viennaToday = getViennaTodayDate();
  // Test A: Direct fetch of historical version on modern stichtag fails closed
  const nor12040713Html = `<!doctype html><html><head><title>MRG § 3 alt</title></head><body>
    <div class="contentBlock"><h3>Kurztitel</h3>Mietrechtsgesetz</div>
    <div class="contentBlock"><h3>§/Artikel/Anlage</h3>§ 3</div>
    <div class="contentBlock"><h3>Inkrafttretensdatum</h3>01.01.1982</div>
    <div class="contentBlock"><h3>Außerkrafttretensdatum</h3>31.12.2014</div>
    <div class="contentBlock"><h3>Dokumentnummer</h3>NOR12040713</div>
    <div class="documentContent"><p>§ 3 historische Fassung</p></div>
  </body></html>`;

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(nor12040713Html, { status: 200 }), async () => {
      const syncRes = await risSyncLawsStub({
        laws: [{ sourceId: "NOR12040713", stichtag: viennaToday }],
      });

      // Single item batch with mismatch must return success: false
      assert.equal(syncRes.success, false);
      if (syncRes.success) return;
      assert.equal(syncRes.error.code, "NO_VALID_VERSION_FOR_STICHTAG");
      assert.equal(syncRes.error.retryable, false);
      const details = syncRes.error.details as Record<string, unknown>;
      assert.equal(details.stichtag_mismatch, 1);
      assert.equal(details.failed, 1);
      assert.equal(details.verified_current, 0);
    });

    // Test B: Network failure emits phase, url, retryable: true
    await withMockedFetch(async () => {
      throw new TypeError("fetch failed");
    }, async () => {
      const segRes = await risFetchSegmentStub({ sourceId: "NOR40273695" });
      assert.equal(segRes.success, false);
      if (segRes.success) return;
      assert.equal(segRes.error.code, "UPSTREAM_UNAVAILABLE");
      assert.equal(segRes.error.retryable, true);
      const details = segRes.error.details as Record<string, unknown>;
      assert.equal(details.phase, "fetch_segment_http_request");
      assert.ok(String(details.url).includes("NOR40273695"));
    });
  });
});

console.log("all legal regression tests passed");

