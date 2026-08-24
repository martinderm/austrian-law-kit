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
import { fetchHistoryApiRaw, searchGemeindenApiRaw } from "../src/ris-api/index.ts";
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

    assert.equal(result.success, true);
    if (!result.success) return;
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

    assert.equal(result.success, true);
    if (!result.success) return;
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

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(fetchCalled, false);
    assert.equal(result.data.resolver_kind, "sourceId");
    assert.equal(result.data.hits[0]?.source_id, "LOO12009295");
    assert.equal(result.data.best_candidate?.confidence, "high");
    assert.ok(result.data.hits[0]?.source_url.includes("Abfrage=Landesnormen"));
  });
});

await test("ris_search recognizes norm references with trailing heading text", async () => {
  const { resolveRisQuery } = await import("../src/ris/query-resolver.ts");
  const parsed = resolveRisQuery("§ 74 StGB Andere Begriffsbestimmungen");

  assert.equal(parsed.kind, "normRef");
  if (parsed.kind !== "normRef") return;
  assert.equal(parsed.lawAbbreviation, "StGB");
  assert.equal(parsed.sectionRef, "§ 74");
  assert.ok(parsed.searchVariants.includes("StGB § 74 Andere Begriffsbestimmungen"));
  assert.ok(parsed.searchVariants.includes("§ 74 StGB Andere Begriffsbestimmungen"));
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

    assert.equal(result.success, true);
    if (!result.success) return;
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

    assert.equal(result.success, true);
    if (!result.success) return;
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

await test("ris_search ranks Stammnormen above authentische Interpretationen for free-text Landesrecht queries", async () => {
  const apiJson = JSON.stringify({
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '2' },
        OgdDocumentReference: [
          {
            Data: {
              Metadaten: {
                Technisch: { ID: 'LNO40026933', Applikation: 'LrKons' },
                Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/eli/lgbl/NI/2018/13/P0/LNO40026933' },
                Landesrecht: {
                  Kurztitel: 'Authentische Interpretation NÖ Bauordnung 2014 und NÖ Raumordnungsgesetz 2014',
                  Bundesland: 'Niederösterreich',
                  LrKons: {
                    Dokumenttyp: 'Norm',
                    ArtikelParagraphAnlage: '§ 0',
                    Paragraphnummer: '0',
                    Gesetzesnummer: '20001185',
                    GesamteRechtsvorschriftUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrNO&Gesetzesnummer=20001185',
                  },
                },
              },
              Dokumentliste: {
                ContentReference: { Urls: { ContentUrl: [{ DataType: 'Html', Url: 'https://www.ris.bka.gv.at/Dokumente/Landesnormen/LNO40026933/LNO40026933.html' }] } },
              },
            },
          },
          {
            Data: {
              Metadaten: {
                Technisch: { ID: 'LNO11001489', Applikation: 'LrKons' },
                Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/eli/lgbl/NI/2014/1/P0/LNO11001489' },
                Landesrecht: {
                  Kurztitel: 'NÖ Bauordnung 2014',
                  Bundesland: 'Niederösterreich',
                  LrKons: {
                    Dokumenttyp: 'Norm',
                    Typ: 'Stammfassung',
                    ArtikelParagraphAnlage: '§ 0',
                    Paragraphnummer: '0',
                    Gesetzesnummer: '20001079',
                    GesamteRechtsvorschriftUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrNO&Gesetzesnummer=20001079',
                  },
                },
              },
              Dokumentliste: {
                ContentReference: { Urls: { ContentUrl: [{ DataType: 'Html', Url: 'https://www.ris.bka.gv.at/Dokumente/Landesnormen/LNO11001489/LNO11001489.html' }] } },
              },
            },
          },
        ],
      },
    },
  });

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes('data.bka.gv.at/ris/api/v2.6/Landesrecht')) {
      return new Response(apiJson, { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('<html></html>', { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: 'Bauordnung', scope: 'land', state: 'Niederösterreich', limit: 5 });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.best_candidate?.source_id, 'LNO11001489');
    assert.equal(result.data.best_candidate?.title, 'NÖ Bauordnung 2014');
    assert.equal(result.data.best_candidate?.legal_type, 'Stammfassung');
  });
});

await test("ris_search prefers exact paragraph API hits for StGB § 74 and ignores wrong ones", async () => {
  const apiJson = JSON.stringify({
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '3' },
        OgdDocumentReference: [
          {
            Data: {
              Metadaten: {
                Technisch: { ID: 'NOR11002319', Applikation: 'BrKons' },
                Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/eli/bgbl/1974/60/P0/NOR11002319' },
                Bundesrecht: {
                  Kurztitel: 'Strafgesetzbuch',
                  Abkuerzung: 'StGB',
                  BrKons: {
                    Dokumenttyp: 'Norm',
                    ArtikelParagraphAnlage: '§ 0',
                    Paragraphnummer: '0',
                    Gesetzesnummer: '10002296',
                    GesamteRechtsvorschriftUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002296',
                  },
                },
              },
              Dokumentliste: {
                ContentReference: { Urls: { ContentUrl: [{ DataType: 'Html', Url: 'https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR11002319/NOR11002319.html' }] } },
              },
            },
          },
          {
            Data: {
              Metadaten: {
                Technisch: { ID: 'NOR40211111', Applikation: 'BrKons' },
                Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/eli/bgbl/1974/60/P64/NOR40211111' },
                Bundesrecht: {
                  Kurztitel: '§ 64 StGB',
                  Abkuerzung: 'StGB',
                  BrKons: {
                    Dokumenttyp: 'Paragraph',
                    ArtikelParagraphAnlage: '§ 64',
                    Paragraphnummer: '64',
                    Gesetzesnummer: '10002296',
                    GesamteRechtsvorschriftUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002296',
                  },
                },
              },
              Dokumentliste: {
                ContentReference: { Urls: { ContentUrl: [{ DataType: 'Html', Url: 'https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40211111/NOR40211111.html' }] } },
              },
            },
          },
          {
            Data: {
              Metadaten: {
                Technisch: { ID: 'NOR40254282', Applikation: 'BrKons' },
                Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/eli/bgbl/1974/60/P74/NOR40254282' },
                Bundesrecht: {
                  Kurztitel: '§ 74 StGB – Andere Begriffsbestimmungen',
                  Abkuerzung: 'StGB',
                  BrKons: {
                    Dokumenttyp: 'Paragraph',
                    ArtikelParagraphAnlage: '§ 74',
                    Paragraphnummer: '74',
                    Gesetzesnummer: '10002296',
                    GesamteRechtsvorschriftUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002296',
                  },
                },
              },
              Dokumentliste: {
                ContentReference: { Urls: { ContentUrl: [{ DataType: 'Html', Url: 'https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40254282/NOR40254282.html' }] } },
              },
            },
          },
        ],
      },
    },
  });

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes("data.bka.gv.at/ris/api/v2.6/Bundesrecht")) {
      assert.ok(url.includes("VonParagraf=74"));
      assert.ok(!url.includes("BisParagraf=74"));
      return new Response(apiJson, { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("<html></html>", { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: "StGB § 74", limit: 10, docType: "norm", scope: "bund", authentic: true });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.best_candidate?.source_id, "NOR40254282");
    assert.equal(result.data.best_candidate?.section_ref, "§ 74");
    assert.ok(result.data.hits.every((hit) => hit.paragraph_number === "74"));
  });
});

await test("ris_search uses API pagination for Bundesrecht when more pages are needed", async () => {
  const page1 = JSON.stringify({
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { '@pageNumber': '1', '@pageSize': '1', '#text': '2' },
        OgdDocumentReference: {
          Data: {
            Metadaten: {
              Technisch: { ID: 'NOR40198929', Applikation: 'BrKons' },
              Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/eli/jgs/1811/946/P0/NOR40198929' },
              Bundesrecht: {
                Kurztitel: 'Allgemeines bürgerliches Gesetzbuch',
                BrKons: {
                  Dokumenttyp: 'Norm',
                  ArtikelParagraphAnlage: '§ 0',
                  Paragraphnummer: '0',
                  Abkuerzung: 'ABGB',
                  Gesetzesnummer: '10001622',
                  GesamteRechtsvorschriftUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001622',
                },
              },
            },
            Dokumentliste: {
              ContentReference: { Urls: { ContentUrl: [{ DataType: 'Html', Url: 'https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40198929/NOR40198929.html' }] } },
            },
          },
        },
      },
    },
  });
  const page2 = JSON.stringify({
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { '@pageNumber': '2', '@pageSize': '1', '#text': '2' },
        OgdDocumentReference: {
          Data: {
            Metadaten: {
              Technisch: { ID: 'NOR12019035', Applikation: 'BrKons' },
              Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/eli/jgs/1811/946/P1293/NOR12019035' },
              Bundesrecht: {
                Kurztitel: 'Allgemeines bürgerliches Gesetzbuch',
                BrKons: {
                  Dokumenttyp: 'Paragraph',
                  ArtikelParagraphAnlage: '§ 1293',
                  Paragraphnummer: '1293',
                  Abkuerzung: 'ABGB',
                  Gesetzesnummer: '10001622',
                  GesamteRechtsvorschriftUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001622',
                },
              },
            },
            Dokumentliste: {
              ContentReference: { Urls: { ContentUrl: [{ DataType: 'Html', Url: 'https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019035/NOR12019035.html' }] } },
            },
          },
        },
      },
    },
  });
  let apiCalls = 0;

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes('data.bka.gv.at/ris/api/v2.6/Bundesrecht') && url.includes('Seitennummer=1')) {
      apiCalls += 1;
      return new Response(page1, { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('data.bka.gv.at/ris/api/v2.6/Bundesrecht') && url.includes('Seitennummer=2')) {
      apiCalls += 1;
      return new Response(page2, { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('<html></html>', { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: '§ 1293 ABGB', limit: 5 });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(apiCalls, 2);
    assert.equal(result.data.best_candidate?.source_id, 'NOR12019035');
    assert.ok(result.meta.notices?.includes('api_pagination_used: Bundesrecht page 2'));
  });
});

await test("searchGemeindenApiRaw builds the official Gemeinden API request", async () => {
  let seenUrl = "";

  await withMockedFetch(async (input) => {
    seenUrl = String(input);
    return new Response(JSON.stringify({ OgdSearchResult: { OgdDocumentResults: { Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '0' } } } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }, async () => {
    const result = await searchGemeindenApiRaw({ query: 'Bauordnung', state: 'Wien', municipality: 'Wien', authentic: true });
    assert.ok(seenUrl.includes('/Gemeinden?'));
    assert.ok(seenUrl.includes('Applikation=GrA'));
    assert.ok(seenUrl.includes('SucheInWien=true'));
    assert.ok(seenUrl.includes('Gemeinde=Wien'));
    assert.equal(result.hitsMeta.totalHits, 0);
  });
});

await test("ris_search supports municipal API discovery", async () => {
  const apiJson = JSON.stringify({
    OgdSearchResult: {
      OgdDocumentResults: {
        Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '1' },
        OgdDocumentReference: {
          Data: {
            Metadaten: {
              Technisch: { ID: 'GEMREA_OB_40411_20260408_1', Applikation: 'GrA', Organ: 'Haigermoos' },
              Allgemein: { DokumentUrl: 'https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=GemeinderechtAuth&Dokumentnummer=GEMREA_OB_40411_20260408_1' },
              Gemeinden: {
                Kurztitel: 'Abfallgebührenordnung',
                Titel: 'Verordnung des Gemeinderates der Gemeinde Haigermoos betreffend Abfallgebühren',
                Bundesland: 'Oberösterreich',
                Gemeinde: 'Haigermoos',
                Typ: 'Verordnung',
                GrA: {
                  Bezirk: 'Braunau',
                  KundmachungsorganNr: 'VBl. Nr. 1/2026',
                  Kundmachungsdatum: '2026-04-08',
                },
              },
            },
            Dokumentliste: {
              ContentReference: {
                ContentType: 'MainDocument',
                Name: 'Hauptdokument',
                Urls: { ContentUrl: { DataType: 'Authentisch', Url: 'https://www.ris.bka.gv.at/Dokumente/GemeinderechtAuth/GEMREA_OB_40411_20260408_1/GEMREA_OB_40411_20260408_1.pdf' } },
              },
            },
          },
        },
      },
    },
  });

  await withMockedFetch(async (input) => {
    const url = String(input);
    if (url.includes('/Gemeinden?')) {
      assert.ok(url.includes('Applikation=GrA'));
      assert.ok(url.includes('SucheInOberoesterreich=true'));
      assert.ok(url.includes('Gemeinde=Haigermoos'));
      return new Response(apiJson, { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('<html></html>', { status: 500 });
  }, async () => {
    const result = await risSearchStub({ query: 'Abfallgebührenordnung', scope: 'municipal', state: 'Oberösterreich', municipality: 'Haigermoos', authentic: true, limit: 5 });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.best_candidate?.application, 'GrA');
    assert.equal(result.data.best_candidate?.scope, 'municipal');
    assert.equal(result.data.best_candidate?.municipality, 'Haigermoos');
    assert.equal(result.data.best_candidate?.district, 'Braunau');
    assert.ok(result.meta.notices?.includes('api_search: Gemeinden'));
    assert.ok(result.meta.notices?.includes('api_municipality_filter: Haigermoos'));
  });
});

await test("fetchHistoryApiRaw builds the official History API request", async () => {
  let seenUrl = "";

  await withMockedFetch(async (input) => {
    seenUrl = String(input);
    return new Response(JSON.stringify({ OgdSearchResult: { OgdDocumentResults: { Hits: { '@pageNumber': '1', '@pageSize': '20', '#text': '3' } } } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }, async () => {
    const result = await fetchHistoryApiRaw({ changedFrom: '2026-04-01', changedTo: '2026-04-08', includeDeletedDocuments: true });
    assert.ok(seenUrl.includes('/History?'));
    assert.ok(!seenUrl.includes('Anwendung='));
    assert.ok(seenUrl.includes('AenderungenVon=2026-04-01'));
    assert.ok(seenUrl.includes('IncludeDeletedDocuments=true'));
    assert.equal(result.hitsMeta.totalHits, 3);
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

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.ok(result.meta.notices?.includes("html_fallback_used"));
    assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("api_variant_failed:")));
    assert.ok(result.meta.warnings?.includes("api_error_type: API_ERROR"));
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
    assert.ok(url.includes("VonParagraf=2"));
    assert.ok(url.includes("BisParagraf=2"));
    assert.ok(url.includes("Position=1"));
    assert.ok(url.includes("SkipToDocumentPage=true"));
    return new Response(html, { status: 200 });
  }, async () => {
    const result = await risSearchStub({ query: "§ 2 abgb", limit: 5 });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.normalized_query, "§ 2 abgb");
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

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.error.code, "VALIDATION_ERROR");
});

await test("ris_search validates state for Landesnormen scope", async () => {
  const result = await risSearchStub({ query: "Bauordnung", scope: "land" });

  assert.equal(result.success, false);
  if (result.success) return;
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

    assert.equal(result.success, true);
    if (!result.success) return;
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

    assert.equal(result.success, true);
    if (!result.success) return;
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

    assert.equal(result.success, false);
    if (result.success) return;
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

    assert.equal(result.success, true);
    if (!result.success) return;
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

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.best_candidate?.source_id, 'LOO12009295');
    assert.equal(result.data.best_candidate?.confidence, 'high');
  });
});

await test("ris_fetch_segment returns a usable artifact from a live-derived fixture-backed fetch", async () => {
  const html = fixture("fixtures/ris/nor40214078-live.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await risFetchSegmentStub({ sourceId: "NOR40214078" });

      assert.equal(result.success, true);
      if (!result.success) return;
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

await test("ris_fetch_segment prefers API-resolved content_url when sourceId is given", async () => {
  const apiJson = fixture("fixtures/ris-api/lookup-nor12019035.json");
  const html = fixture("fixtures/ris/nor40214078-live.html");
  const seenUrls: string[] = [];

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      seenUrls.push(url);
      if (url.includes("data.bka.gv.at/ris/api/v2.6/Bundesrecht")) {
        return new Response(apiJson, { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(html, { status: 200 });
    }, async () => {
      const result = await risFetchSegmentStub({ sourceId: "NOR12019035", refresh: true });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.ok(seenUrls.some((url) => url.includes("Suchworte=NOR12019035")));
      assert.equal(result.data.artifact.frontmatter.source_url, "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019035/NOR12019035.html");
      const apiMeta = (result.data.artifact.metadata?.ris_api ?? {}) as Record<string, unknown>;
      assert.equal(apiMeta.law_id, "10001622");
      assert.ok(result.meta.notices?.includes("api_lookup_used: preferred content_url for segment fetch"));
    });
  });
});

await test("ris_fetch_segment accepts contentUrl directly and skips API lookup", async () => {
  const html = fixture("fixtures/ris/nor40214078-live.html");
  const seenUrls: string[] = [];

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      seenUrls.push(url);
      return new Response(html, { status: 200 });
    }, async () => {
      const result = await risFetchSegmentStub({ sourceId: "NOR12019035", contentUrl: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019035/NOR12019035.html", refresh: true });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.equal(seenUrls.length, 1);
      assert.equal(seenUrls[0], "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019035/NOR12019035.html");
      assert.equal(result.data.artifact.frontmatter.source_url, "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR12019035/NOR12019035.html");
    });
  });
});

await test("ris_fetch_segment returns VALIDATION_ERROR without source identifier", async () => {
  const result = await risFetchSegmentStub({});

  assert.equal(result.success, false);
  if (result.success) return;
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

      assert.equal(result.success, true);
      if (!result.success) return;
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

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.equal(result.data.artifact.frontmatter.doc_type, "norm_document");
      assert.equal(result.data.artifact.frontmatter.title, "Allgemeines bürgerliches Gesetzbuch für die gesammten deutschen Erbländer der Oesterreichischen Monarchie\nStF: JGS Nr. 946/1811");
      assert.equal(result.data.artifact.frontmatter.law_title, "Allgemeines bürgerliches Gesetzbuch für die gesammten deutschen Erbländer der Oesterreichischen Monarchie\nStF: JGS Nr. 946/1811");
      assert.equal(result.data.artifact.frontmatter.representation, "whole_law");
      const extractedMeta = (result.data.artifact.metadata?.ris_extracted ?? {}) as Record<string, unknown>;
      assert.equal(extractedMeta.representation, "whole_law");
      assert.ok(result.data.artifact.content.trim().length > 100);
      assert.equal(result.data.artifact.content.includes("Startseite Bund Länder Bezirke Gemeinden"), false);
    });
  });
});

await test("ris_fetch_whole_law prefers API-resolved whole_law_url when sourceId is given", async () => {
  const apiJson = fixture("fixtures/ris-api/lookup-loo11000699.json");
  const html = fixture("fixtures/ris/abgb-whole-law-live.html");
  const seenUrls: string[] = [];

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      seenUrls.push(url);
      if (url.includes("data.bka.gv.at/ris/api/v2.6/Landesrecht")) {
        return new Response(apiJson, { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(html, { status: 200 });
    }, async () => {
      const result = await risFetchWholeLawStub({ sourceId: "LOO11000699", refresh: true });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.ok(seenUrls.some((url) => url.includes("Suchworte=LOO11000699")));
      assert.equal(result.data.artifact.frontmatter.source_url, "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrOO&Gesetzesnummer=10000411");
      assert.equal(result.data.artifact.frontmatter.representation, "whole_law");
      const extractedMeta = (result.data.artifact.metadata?.ris_extracted ?? {}) as Record<string, unknown>;
      assert.equal(extractedMeta.representation, "whole_law");
      const apiMeta = (result.data.artifact.metadata?.ris_api ?? {}) as Record<string, unknown>;
      assert.equal(apiMeta.law_id, "10000411");
      assert.ok(result.meta.notices?.includes("api_lookup_used: preferred whole_law_url for whole-law fetch"));
    });
  });
});

await test("ris_fetch_whole_law accepts wholeLawUrl directly and skips API lookup", async () => {
  const html = fixture("fixtures/ris/abgb-whole-law-live.html");
  const seenUrls: string[] = [];

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      seenUrls.push(url);
      return new Response(html, { status: 200 });
    }, async () => {
      const result = await risFetchWholeLawStub({ sourceId: "LOO11000699", wholeLawUrl: "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrOO&Gesetzesnummer=10000411", refresh: true });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.equal(seenUrls.length, 1);
      assert.equal(seenUrls[0], "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrOO&Gesetzesnummer=10000411");
      assert.equal(result.data.artifact.frontmatter.source_url, "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrOO&Gesetzesnummer=10000411");
      assert.equal(result.data.artifact.frontmatter.representation, "whole_law");
    });
  });
});

await test("ris_fetch_whole_law accepts Bundesnormen wholeLawUrl with Gesetzesnummer without Dokumentnummer", async () => {
  const html = fixture("fixtures/ris/abgb-whole-law-live.html");
  const seenUrls: string[] = [];

  await withTempCacheRoot(async () => {
    await withMockedFetch(async (input) => {
      const url = String(input);
      seenUrls.push(url);
      return new Response(html, { status: 200 });
    }, async () => {
      const result = await risFetchWholeLawStub({ wholeLawUrl: "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002296", refresh: true });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.equal(seenUrls.length, 1);
      assert.equal(seenUrls[0], "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002296");
      assert.equal(result.data.artifact.frontmatter.source_id, "LAW:Bundesnormen:10002296");
      assert.equal(result.data.artifact.frontmatter.source_url, "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002296");
      assert.equal(result.data.artifact.frontmatter.representation, "whole_law");
    });
  });
});

await test("ris_fetch_segment extracts full text for StGB § 111 live case html", async () => {
  const html = String.raw`<!doctype html><html lang="de"><head><title>RIS Dokument</title></head><body><main><div class="p"><h3>Kurztitel</h3><div>Strafgesetzbuch</div></div><div class="p"><h3>Typ</h3><div>BG</div></div><div class="p"><h3>Inkrafttretensdatum</h3><div>01.01.2016</div></div><div class="p"><h3>Abkürzung</h3><div>StGB</div></div><div class="p"><h3>Index</h3><div>24/01 Strafgesetzbuch</div></div><div class="p"><h3>§/Artikel/Anlage</h3><div>§ 111</div></div><div id="foo_TextContainer_bar" class="embeddedContent"><h3>Text</h3><div><h4 class="UeberschrPara"><span aria-hidden="true">Vierter Abschnitt</span></h4><h5 class="GldSymbol"><span aria-hidden="true">§ 111. Üble Nachrede.</span></h5><div class="Abs AlignJustify">Wer einen anderen in einer für einen Dritten wahrnehmbaren Weise einer verächtlichen Eigenschaft oder Gesinnung zeiht oder eines unehrenhaften Verhaltens oder eines gegen die guten Sitten verstoßenden Verhaltens beschuldigt, das geeignet ist, ihn in der öffentlichen Meinung verächtlich zu machen oder herabzusetzen, ist mit Freiheitsstrafe bis zu sechs Monaten oder mit Geldstrafe bis zu 360 Tagessätzen zu bestrafen.</div><div class="Abs AlignJustify">Wer die Tat in einem Druckwerk, im Rundfunk oder sonst auf eine Weise begeht, wodurch die üble Nachrede einer breiten Öffentlichkeit zugänglich wird, ist mit Freiheitsstrafe bis zu einem Jahr oder mit Geldstrafe bis zu 720 Tagessätzen zu bestrafen.</div></div></div><div class="p"><h3>Gesetzesnummer</h3><div>10002296</div></div><div class="p"><h3>Dokumentnummer</h3><div>NOR40173633</div></div></main></body></html>`;

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await risFetchSegmentStub({ sourceId: "NOR40173633", refresh: true });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.equal(result.data.artifact.frontmatter.law_title, "Strafgesetzbuch");
      assert.equal(result.data.artifact.frontmatter.law_abbreviation, "StGB");
      assert.equal(result.data.artifact.frontmatter.segment_ref, "§ 111");
      assert.ok(result.data.artifact.content.includes("verächtlichen Eigenschaft oder Gesinnung"));
      assert.ok(result.data.artifact.content.includes("Freiheitsstrafe bis zu sechs Monaten"));
      assert.ok(result.data.artifact.content.length > 250);
    });
  });
});

await test("ris_fetch_segment extracts paragraph content from RIS xml layout (NOR12029654)", async () => {
  const xml = await fetch("https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR12029654/NOR12029654.xml").then((response) => response.text());

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(xml, { status: 200, headers: { "content-type": "application/xml" } }), async () => {
      const result = await risFetchSegmentStub({
        sourceId: "NOR12029654",
        contentUrl: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR12029654/NOR12029654.xml",
        refresh: true,
      });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.equal(result.data.artifact.frontmatter.law_title, "Strafgesetzbuch");
      assert.equal(result.data.artifact.frontmatter.segment_ref, "§ 111");
      assert.ok(result.data.artifact.content.includes("Wer einen anderen in einer für einen Dritten wahrnehmbaren Weise"));
      assert.ok(result.data.artifact.content.includes("Freiheitsstrafe bis zu sechs Monaten"));
      assert.ok(result.data.artifact.content.length > 400);
    });
  });
});

await test("ris_fetch_segment keeps nested list content from RIS xml layout (NOR40254282)", async () => {
  const xml = await fetch("https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40254282/NOR40254282.xml").then((response) => response.text());

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(xml, { status: 200, headers: { "content-type": "application/xml" } }), async () => {
      const result = await risFetchSegmentStub({
        sourceId: "NOR40254282",
        contentUrl: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40254282/NOR40254282.xml",
        refresh: true,
      });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.equal(result.data.artifact.frontmatter.law_title, "Strafgesetzbuch");
      assert.equal(result.data.artifact.frontmatter.segment_ref, "§ 74");
      assert.ok(result.data.artifact.content.includes("1. unmündig: wer das vierzehnte Lebensjahr noch nicht vollendet hat;"));
      assert.ok(result.data.artifact.content.includes("4. Beamter: jeder, der bestellt ist, im Namen des Bundes"));
      assert.ok(result.data.artifact.content.includes("4a. Amtsträger: jeder, der"));
      assert.ok(result.data.artifact.content.includes("4b. Unionsbeamter: jeder, der Beamter oder sonstiger Bediensteter"));
      assert.ok(result.data.artifact.content.includes("10. unbares Zahlungsmittel:"));
      assert.ok(result.data.artifact.content.includes("11. kritische Infrastruktur:"));
      assert.ok(result.data.artifact.content.startsWith("## Andere Begriffsbestimmungen\n(1) Im Sinn dieses Bundesgesetzes ist"));
      assert.ok(result.data.artifact.content.includes("- 1. unmündig: wer das vierzehnte Lebensjahr noch nicht vollendet hat;"));
      assert.ok(result.data.artifact.content.includes("  - b. für den Bund, ein Land, einen Gemeindeverband"));
      assert.ok(result.data.artifact.content.includes("  - d) als Organ oder Bediensteter eines Unternehmens tätig ist"));
      assert.ok(result.data.artifact.content.includes("- 9. Prostitution: die Vornahme geschlechtlicher Handlungen"));
      assert.ok(result.data.artifact.content.includes("(Anm.: Z\u00a02 aufgehoben durch BGBl."));
      assert.ok(result.data.artifact.content.includes("(Anm.: lit.\u00a0a aufgehoben durch BGBl."));
      const idxLead = result.data.artifact.content.indexOf("(1) Im Sinn dieses Bundesgesetzes ist");
      const idxFirstItem = result.data.artifact.content.indexOf("- 1. unmündig: wer das vierzehnte Lebensjahr noch nicht vollendet hat;");
      const idxAnm = result.data.artifact.content.indexOf("(Anm.: Z");
      const idxSecondPara = result.data.artifact.content.indexOf("(2) Im Sinne dieses Bundesgesetzes sind Daten sowohl personenbezogene");
      assert.ok(idxLead >= 0 && idxFirstItem > idxLead);
      assert.ok(idxAnm > idxFirstItem);
      assert.ok(idxSecondPara > idxAnm);
      assert.ok(result.data.artifact.content.length > 3000);
    });
  });
});

await test("ris_fetch_whole_law returns NOT_FOUND on HTTP 404", async () => {
  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response("not found", { status: 404 }), async () => {
      const result = await risFetchWholeLawStub({ sourceId: "NOR404" });

      assert.equal(result.success, false);
      if (result.success) return;
      assert.equal(result.error.code, "NOT_FOUND");
    });
  });
});

await test("jusline_fetch_discussions returns hits from fixture-backed fetch", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-discussions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await juslineFetchDiscussionsStub({ query: "stgb/paragraf/111", limit: 5 });

      assert.equal(result.success, true);
      if (!result.success) return;
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

    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.error.code, "NOT_FOUND");
  });
});

await test("jusline_fetch_discussions exposes refresh notice when refresh=true", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-discussions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await juslineFetchDiscussionsStub({ query: "stgb/paragraf/111", refresh: true });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.ok(result.meta.notices?.includes("cache_refresh: bypassed cached artifact and fetched fresh content"));
    });
  });
});

await test("jusline_list_decisions returns hits from fixture-backed fetch", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-decisions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const result = await juslineListDecisionsStub({ query: "stgb/paragraf/111", limit: 5 });

      assert.equal(result.success, true);
      if (!result.success) return;
      assert.ok(result.data.hits.length >= 1);
      assert.ok(result.data.hits[0]?.source_url.includes("/entscheidungen/"));
      assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("preview_cache_written:")));
      assert.ok(result.meta.warnings?.some((entry) => entry.startsWith("query_index_written:")));
    });
  });
});

await test("jusline_list_decisions returns VALIDATION_ERROR for too-short query", async () => {
  const result = await juslineListDecisionsStub({ query: "x" });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.error.code, "VALIDATION_ERROR");
});

await test("jusline_list_decisions returns NOT_FOUND for the no-decisions fixture", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-no-decisions.html");

  await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
    const result = await juslineListDecisionsStub({ query: "stgb/paragraf/111" });

    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.error.code, "NOT_FOUND");
  });
});

await test("jusline_list_decisions writes preview cache artifacts for repeated calls", async () => {
  const html = fixture("fixtures/jusline/stgb-paragraf-111-decisions-variant.html");

  await withTempCacheRoot(async () => {
    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const first = await juslineListDecisionsStub({ query: "stgb/paragraf/111", limit: 5 });
      assert.equal(first.success, true);
      if (!first.success) return;
      assert.ok(first.meta.warnings?.some((entry) => entry.startsWith("preview_cache_written:")));
      assert.ok(first.meta.warnings?.some((entry) => entry.startsWith("query_index_written:")));
    });

    await withMockedFetch(async () => new Response(html, { status: 200 }), async () => {
      const second = await juslineListDecisionsStub({ query: "stgb/paragraf/111", limit: 5 });
      assert.equal(second.success, true);
      if (!second.success) return;
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

    assert.equal(result.success, true);
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

    assert.equal(result.success, true);
    assert.equal(existsSync(expectedCachePath), true);
  });

  rmSync(workspaceDir, { recursive: true, force: true });
  rmSync(configuredCacheRoot, { recursive: true, force: true });
});

console.log("tool smoke tests passed");
