/**
 * Canonical Austrian Federal Laws (Bundesnormen) Registry
 * Maps legal abbreviations, slugs, and aliases to verified RIS Gesetzesnummern and metadata.
 * Single Source of Truth for canonical law lookup and fast API-search acceleration.
 */

export interface CanonicalLawEntry {
  slug: string;
  abbreviation: string;
  title: string;
  gesetzesnummer: string;
  stammfassung?: string;
  aliases: string[];
  scope: "bund";
}

export const CANONICAL_LAWS: readonly CanonicalLawEntry[] = [
  // Zivilrecht & Mietrecht / Wohnrecht / Immobilien
  {
    slug: "abgb",
    abbreviation: "ABGB",
    title: "Allgemeines bürgerliches Gesetzbuch",
    gesetzesnummer: "10001622",
    stammfassung: "JGS Nr. 946/1811",
    aliases: ["abgb", "allgemeinesbuergerlichesgesetzbuch", "allgemeinesbürgerlichesgesetzbuch"],
    scope: "bund",
  },
  {
    slug: "mrg",
    abbreviation: "MRG",
    title: "Mietrechtsgesetz",
    gesetzesnummer: "10002531",
    stammfassung: "BGBl. Nr. 520/1981",
    aliases: ["mrg", "mietrechtsgesetz"],
    scope: "bund",
  },
  {
    slug: "weg",
    abbreviation: "WEG",
    title: "Wohnungseigentumsgesetz 2002",
    gesetzesnummer: "20001921",
    stammfassung: "BGBl. I Nr. 70/2002",
    aliases: ["weg", "weg2002", "wohnungseigentumsgesetz", "wohnungseigentumsgesetz2002"],
    scope: "bund",
  },
  {
    slug: "wgg",
    abbreviation: "WGG",
    title: "Wohnungsgemeinnützigkeitsgesetz",
    gesetzesnummer: "10002540",
    stammfassung: "BGBl. Nr. 139/1979",
    aliases: ["wgg", "wohnungsgemeinnuetzigkeitsgesetz", "wohnungsgemeinnützigkeitsgesetz"],
    scope: "bund",
  },
  {
    slug: "heizkg",
    abbreviation: "HeizKG",
    title: "Heizkostenabrechnungsgesetz",
    gesetzesnummer: "10002894",
    stammfassung: "BGBl. Nr. 827/1992",
    aliases: ["heizkg", "heizkostenabrechnungsgesetz"],
    scope: "bund",
  },
  {
    slug: "mieweg",
    abbreviation: "MieWeG",
    title: "Mieten-Wertsicherungs-Begrenzungsgesetz",
    gesetzesnummer: "20012543",
    stammfassung: "BGBl. I Nr. 154/2023",
    aliases: ["mieweg", "mietenwertsicherungsbegrenzungsgesetz"],
    scope: "bund",
  },
  {
    slug: "eheg",
    abbreviation: "EheG",
    title: "Ehegesetz",
    gesetzesnummer: "10001871",
    stammfassung: "dRGBl. I S 807/1938",
    aliases: ["eheg", "ehegesetz"],
    scope: "bund",
  },

  // Verbraucherrecht & Vertrieb
  {
    slug: "kschg",
    abbreviation: "KSchG",
    title: "Konsumentenschutzgesetz",
    gesetzesnummer: "10002462",
    stammfassung: "BGBl. Nr. 140/1979",
    aliases: ["kschg", "konsumentenschutzgesetz"],
    scope: "bund",
  },
  {
    slug: "fagg",
    abbreviation: "FAGG",
    title: "Fern- und Auswärtsgeschäfte-Gesetz",
    gesetzesnummer: "20008855",
    stammfassung: "BGBl. I Nr. 33/2014",
    aliases: ["fagg", "fernundauswaertsgeschaeftegesetz", "fernundauswärtsgeschäftegesetz"],
    scope: "bund",
  },
  {
    slug: "vrug",
    abbreviation: "VRUG",
    title: "Verbraucherrechte-Richtlinie-Umsetzungsgesetz",
    gesetzesnummer: "20008854",
    stammfassung: "BGBl. I Nr. 33/2014",
    aliases: ["vrug", "verbraucherrechterichtlinieumsetzungsgesetz"],
    scope: "bund",
  },
  {
    slug: "vkrg",
    abbreviation: "VKrG",
    title: "Verbraucherkreditgesetz",
    gesetzesnummer: "20006841",
    stammfassung: "BGBl. I Nr. 28/2010",
    aliases: ["vkrg", "verbraucherkreditgesetz"],
    scope: "bund",
  },
  {
    slug: "hikrg",
    abbreviation: "HIKrG",
    title: "Hypothekar- und Immobilienkreditgesetz",
    gesetzesnummer: "20009477",
    stammfassung: "BGBl. I Nr. 35/2016",
    aliases: ["hikrg", "hypothekarundimmobilienkreditgesetz"],
    scope: "bund",
  },

  // Unternehmens- & Gesellschaftsrecht
  {
    slug: "ugb",
    abbreviation: "UGB",
    title: "Unternehmensgesetzbuch",
    gesetzesnummer: "10001702",
    stammfassung: "dRGBl. S 219/1897",
    aliases: ["ugb", "unternehmensgesetzbuch", "hgb", "handelsgesetzbuch"],
    scope: "bund",
  },
  {
    slug: "gmbhg",
    abbreviation: "GmbHG",
    title: "Gesetz über Gesellschaften mit beschränkter Haftung",
    gesetzesnummer: "10001720",
    stammfassung: "RGBl. Nr. 58/1906",
    aliases: ["gmbhg", "gmbhgesetz"],
    scope: "bund",
  },
  {
    slug: "aktg",
    abbreviation: "AktG",
    title: "Aktiengesetz 1965",
    gesetzesnummer: "10002070",
    stammfassung: "BGBl. Nr. 98/1965",
    aliases: ["aktg", "aktiengesetz", "aktg1965"],
    scope: "bund",
  },
  {
    slug: "gewo",
    abbreviation: "GewO",
    title: "Gewerbeordnung 1994",
    gesetzesnummer: "10007565",
    stammfassung: "BGBl. Nr. 194/1994",
    aliases: ["gewo", "gewo1994", "gewerbeordnung", "gewerbeordnung1994"],
    scope: "bund",
  },

  // Steuer- & Abgabenrecht
  {
    slug: "estg",
    abbreviation: "EStG",
    title: "Einkommensteuergesetz 1988",
    gesetzesnummer: "10004570",
    stammfassung: "BGBl. Nr. 400/1988",
    aliases: ["estg", "estg1988", "einkommensteuergesetz", "einkommensteuergesetz1988"],
    scope: "bund",
  },
  {
    slug: "ustg",
    abbreviation: "UStG",
    title: "Umsatzsteuergesetz 1994",
    gesetzesnummer: "10004873",
    stammfassung: "BGBl. Nr. 663/1994",
    aliases: ["ustg", "ustg1994", "umsatzsteuergesetz", "umsatzsteuergesetz1994"],
    scope: "bund",
  },
  {
    slug: "bao",
    abbreviation: "BAO",
    title: "Bundesabgabenordnung",
    gesetzesnummer: "10004407",
    stammfassung: "BGBl. Nr. 194/1961",
    aliases: ["bao", "bundesabgabenordnung"],
    scope: "bund",
  },
  {
    slug: "gebg",
    abbreviation: "GebG",
    title: "Gebührengesetz 1957",
    gesetzesnummer: "10003923",
    stammfassung: "BGBl. Nr. 267/1957",
    aliases: ["gebg", "gebg1957", "gebuehrengesetz", "gebührengesetz"],
    scope: "bund",
  },
  {
    slug: "grestg",
    abbreviation: "GrEStG",
    title: "Grunderwerbsteuergesetz 1987",
    gesetzesnummer: "10004513",
    stammfassung: "BGBl. Nr. 309/1987",
    aliases: ["grestg", "grestg1987", "grunderwerbsteuergesetz"],
    scope: "bund",
  },

  // Verfassungs- & Verwaltungsrecht
  {
    slug: "b-vg",
    abbreviation: "B-VG",
    title: "Bundes-Verfassungsgesetz",
    gesetzesnummer: "10000138",
    stammfassung: "BGBl. Nr. 1/1930",
    aliases: ["b-vg", "bvg", "bundesverfassungsgesetz", "bundes-verfassungsgesetz"],
    scope: "bund",
  },
  {
    slug: "avg",
    abbreviation: "AVG",
    title: "Allgemeines Verwaltungsverfahrensgesetz 1991",
    gesetzesnummer: "10005780",
    stammfassung: "BGBl. Nr. 51/1991",
    aliases: ["avg", "avg1991", "allgemeinesverwaltungsverfahrensgesetz"],
    scope: "bund",
  },
  {
    slug: "vstg",
    abbreviation: "VStG",
    title: "Verwaltungsstrafgesetz 1991",
    gesetzesnummer: "10005782",
    stammfassung: "BGBl. Nr. 52/1991",
    aliases: ["vstg", "vstg1991", "verwaltungsstrafgesetz"],
    scope: "bund",
  },
  {
    slug: "vvg",
    abbreviation: "VVG",
    title: "Verwaltungsvollstreckungsgesetz 1991",
    gesetzesnummer: "10005784",
    stammfassung: "BGBl. Nr. 53/1991",
    aliases: ["vvg", "vvg1991", "verwaltungsvollstreckungsgesetz"],
    scope: "bund",
  },
  {
    slug: "vwgvg",
    abbreviation: "VwGVG",
    title: "Verwaltungsgerichtsverfahrensgesetz",
    gesetzesnummer: "20008255",
    stammfassung: "BGBl. I Nr. 33/2013",
    aliases: ["vwgvg", "verwaltungsgerichtsverfahrensgesetz"],
    scope: "bund",
  },
  {
    slug: "vwgg",
    abbreviation: "VwGG",
    title: "Verwaltungsgerichtshofgesetz 1985",
    gesetzesnummer: "10000729",
    stammfassung: "BGBl. Nr. 10/1985",
    aliases: ["vwgg", "vwgg1985", "verwaltungsgerichtshofgesetz"],
    scope: "bund",
  },
  {
    slug: "vfgg",
    abbreviation: "VfGG",
    title: "Verfassungsgerichtshofgesetz 1953",
    gesetzesnummer: "10000261",
    stammfassung: "BGBl. Nr. 85/1953",
    aliases: ["vfgg", "vfgg1953", "verfassungsgerichtshofgesetz"],
    scope: "bund",
  },
  {
    slug: "spg",
    abbreviation: "SPG",
    title: "Sicherheitspolizeigesetz",
    gesetzesnummer: "10005792",
    stammfassung: "BGBl. Nr. 562/1991",
    aliases: ["spg", "sicherheitspolizeigesetz"],
    scope: "bund",
  },
  {
    slug: "dsg",
    abbreviation: "DSG",
    title: "Datenschutzgesetz",
    gesetzesnummer: "10001597",
    stammfassung: "BGBl. I Nr. 165/1999",
    aliases: ["dsg", "datenschutzgesetz"],
    scope: "bund",
  },

  // Strafrecht & Strafprozess
  {
    slug: "stgb",
    abbreviation: "StGB",
    title: "Strafgesetzbuch",
    gesetzesnummer: "10002296",
    stammfassung: "BGBl. Nr. 60/1974",
    aliases: ["stgb", "strafgesetzbuch"],
    scope: "bund",
  },
  {
    slug: "stpo",
    abbreviation: "StPO",
    title: "Strafprozeßordnung 1975",
    gesetzesnummer: "10002326",
    stammfassung: "BGBl. Nr. 631/1975",
    aliases: ["stpo", "stpo1975", "strafprozessordnung", "strafprozeßordnung"],
    scope: "bund",
  },
  {
    slug: "stvo",
    abbreviation: "StVO",
    title: "Straßenverkehrsordnung 1960",
    gesetzesnummer: "10002177",
    stammfassung: "BGBl. Nr. 159/1960",
    aliases: ["stvo", "stvo1960", "strassenverkehrsordnung", "straßenverkehrsordnung"],
    scope: "bund",
  },
  {
    slug: "kfg",
    abbreviation: "KFG",
    title: "Kraftfahrgesetz 1967",
    gesetzesnummer: "10002206",
    stammfassung: "BGBl. Nr. 267/1967",
    aliases: ["kfg", "kfg1967", "kraftfahrgesetz"],
    scope: "bund",
  },

  // Zivilprozess, Exekution & Insolvenz
  {
    slug: "zpo",
    abbreviation: "ZPO",
    title: "Zivilprozessordnung",
    gesetzesnummer: "10001699",
    stammfassung: "RGBl. Nr. 113/1895",
    aliases: ["zpo", "zivilprozessordnung"],
    scope: "bund",
  },
  {
    slug: "jn",
    abbreviation: "JN",
    title: "Jurisdiktionsnorm",
    gesetzesnummer: "10001698",
    stammfassung: "RGBl. Nr. 111/1895",
    aliases: ["jn", "jurisdiktionsnorm"],
    scope: "bund",
  },
  {
    slug: "eo",
    abbreviation: "EO",
    title: "Exekutionsordnung",
    gesetzesnummer: "10001700",
    stammfassung: "RGBl. Nr. 79/1896",
    aliases: ["eo", "exekutionsordnung"],
    scope: "bund",
  },
  {
    slug: "io",
    abbreviation: "IO",
    title: "Insolvenzordnung",
    gesetzesnummer: "10001736",
    stammfassung: "RGBl. Nr. 337/1914",
    aliases: ["io", "insolvenzordnung", "ko", "konkursordnung"],
    scope: "bund",
  },
  {
    slug: "asgg",
    abbreviation: "ASGG",
    title: "Arbeits- und Sozialgerichtsgesetz",
    gesetzesnummer: "10008620",
    stammfassung: "BGBl. Nr. 104/1985",
    aliases: ["asgg", "arbeitsundsozialgerichtsgesetz"],
    scope: "bund",
  },

  // Arbeits- & Sozialrecht
  {
    slug: "asvg",
    abbreviation: "ASVG",
    title: "Allgemeines Sozialversicherungsgesetz",
    gesetzesnummer: "10008147",
    stammfassung: "BGBl. Nr. 189/1955",
    aliases: ["asvg", "allgemeinessozialversicherungsgesetz"],
    scope: "bund",
  },
  {
    slug: "angg",
    abbreviation: "AngG",
    title: "Angestelltengesetz",
    gesetzesnummer: "10008069",
    stammfassung: "BGBl. Nr. 292/1921",
    aliases: ["angg", "angestelltengesetz"],
    scope: "bund",
  },
  {
    slug: "arbvg",
    abbreviation: "ArbVG",
    title: "Arbeitsverfassungsgesetz",
    gesetzesnummer: "10008329",
    stammfassung: "BGBl. Nr. 22/1974",
    aliases: ["arbvg", "arbeitsverfassungsgesetz"],
    scope: "bund",
  },
  {
    slug: "azg",
    abbreviation: "AZG",
    title: "Arbeitszeitgesetz",
    gesetzesnummer: "10008238",
    stammfassung: "BGBl. Nr. 461/1969",
    aliases: ["azg", "arbeitszeitgesetz"],
    scope: "bund",
  },
  {
    slug: "arg",
    abbreviation: "ARG",
    title: "Arbeitsruhegesetz",
    gesetzesnummer: "10008544",
    stammfassung: "BGBl. Nr. 144/1983",
    aliases: ["arg", "arbeitsruhegesetz"],
    scope: "bund",
  },
  {
    slug: "urlg",
    abbreviation: "UrlG",
    title: "Urlaubsgesetz",
    gesetzesnummer: "10008390",
    stammfassung: "BGBl. Nr. 390/1976",
    aliases: ["urlg", "urlaubsgesetz"],
    scope: "bund",
  },
  {
    slug: "dhg",
    abbreviation: "DHG",
    title: "Dienstnehmerhaftpflichtgesetz",
    gesetzesnummer: "10008182",
    stammfassung: "BGBl. Nr. 80/1965",
    aliases: ["dhg", "dienstnehmerhaftpflichtgesetz"],
    scope: "bund",
  },

  // Wettbewerbs-, Immaterialgüter- & Vergaberecht
  {
    slug: "uwg",
    abbreviation: "UWG",
    title: "Bundesgesetz gegen den unlauteren Wettbewerb 1984",
    gesetzesnummer: "10002670",
    stammfassung: "BGBl. Nr. 448/1984",
    aliases: ["uwg", "unlautererwettbewerb"],
    scope: "bund",
  },
  {
    slug: "kartg",
    abbreviation: "KartG",
    title: "Kartellgesetz 2005",
    gesetzesnummer: "20004386",
    stammfassung: "BGBl. I Nr. 61/2005",
    aliases: ["kartg", "kartg2005", "kartellgesetz"],
    scope: "bund",
  },
  {
    slug: "urhg",
    abbreviation: "UrhG",
    title: "Urheberrechtsgesetz",
    gesetzesnummer: "10001848",
    stammfassung: "BGBl. Nr. 111/1936",
    aliases: ["urhg", "urheberrechtsgesetz"],
    scope: "bund",
  },
  {
    slug: "patg",
    abbreviation: "PatG",
    title: "Patentgesetz 1970",
    gesetzesnummer: "10002167",
    stammfassung: "BGBl. Nr. 259/1970",
    aliases: ["patg", "patg1970", "patentgesetz"],
    scope: "bund",
  },
  {
    slug: "mschg",
    abbreviation: "MSchG",
    title: "Markenschutzgesetz 1970",
    gesetzesnummer: "10002168",
    stammfassung: "BGBl. Nr. 260/1970",
    aliases: ["mschg", "mschg1970", "markenschutzgesetz"],
    scope: "bund",
  },
  {
    slug: "bvergg",
    abbreviation: "BVergG",
    title: "Bundesvergabegesetz 2018",
    gesetzesnummer: "20010295",
    stammfassung: "BGBl. I Nr. 65/2018",
    aliases: ["bvergg", "bverg", "bvergg2018", "bundesvergabegesetz"],
    scope: "bund",
  },
];

// Pre-indexed lookup map for O(1) performance
const LAWS_BY_KEY: Map<string, CanonicalLawEntry> = new Map();

for (const entry of CANONICAL_LAWS) {
  LAWS_BY_KEY.set(entry.slug.toLowerCase(), entry);
  LAWS_BY_KEY.set(entry.abbreviation.toLowerCase().replace(/[^a-z0-9]/g, ""), entry);
  LAWS_BY_KEY.set(entry.gesetzesnummer, entry);
  for (const alias of entry.aliases) {
    LAWS_BY_KEY.set(alias.toLowerCase().replace(/[^a-z0-9]/g, ""), entry);
  }
}

/**
 * Looks up a canonical Austrian federal law by abbreviation, slug, title keyword, or alias.
 */
export function lookupCanonicalLaw(input?: string): CanonicalLawEntry | undefined {
  if (!input) return undefined;
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) return undefined;
  return LAWS_BY_KEY.get(normalized);
}

/**
 * Returns the verified RIS Gesetzesnummer for a given law alias or abbreviation.
 */
export function lookupGesetzesnummer(input?: string): string | undefined {
  return lookupCanonicalLaw(input)?.gesetzesnummer;
}

/**
 * Returns the canonical RIS whole-law URL for a given law alias or abbreviation.
 */
export function getCanonicalWholeLawUrl(input?: string): string | undefined {
  const entry = lookupCanonicalLaw(input);
  if (!entry) return undefined;
  return `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=${entry.gesetzesnummer}`;
}

/**
 * Returns the standard legal abbreviation for a given law alias or slug.
 */
export function getCanonicalAbbreviation(input?: string): string | undefined {
  return lookupCanonicalLaw(input)?.abbreviation;
}

/**
 * Returns all registered canonical laws.
 */
export function getAllCanonicalLaws(): readonly CanonicalLawEntry[] {
  return CANONICAL_LAWS;
}