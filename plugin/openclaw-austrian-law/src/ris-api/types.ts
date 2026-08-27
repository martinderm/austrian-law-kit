import type { AustrianState, SearchHit } from "../types/tool-contracts.js";

export type RisApiScope = "bund" | "land" | "municipal";
export type RisApiApplication = "BrKons" | "LrKons" | "Gr" | "GrA" | "History";

export interface RisApiSearchRequest {
  query: string;
  normalizedQuery: string;
  limit: number;
  scope: RisApiScope;
  state?: AustrianState;
  municipality?: string;
  district?: string;
  authentic?: boolean;
  lawTitle?: string;
  keywords?: string;
  paragraphNumber?: string;
  articleNumber?: string;
  headingRemainder?: string;
  lawId?: string;
}

export interface RisApiSearchCandidate {
  hit: SearchHit;
  application: RisApiApplication;
  scope: RisApiScope;
  state?: AustrianState;
  municipality?: string;
  district?: string;
  lawId?: string;
  lawAbbreviation?: string;
  contentUrl?: string;
  xmlContentUrl?: string;
  wholeLawUrl?: string;
  documentUrl?: string;
}

export interface RisApiSearchSuccess {
  success: true;
  hits: RisApiSearchCandidate[];
  notices?: string[];
  warnings?: string[];
}

export interface RisApiSearchFailure {
  success: false;
  errorCode: "NOT_FOUND" | "UPSTREAM_UNAVAILABLE";
  message: string;
  retryable?: boolean;
  notices?: string[];
  warnings?: string[];
  details?: Record<string, unknown>;
}

export type RisApiSearchResult = RisApiSearchSuccess | RisApiSearchFailure;

export interface RisApiContentUrl {
  DataType?: string;
  Url?: string;
}

export interface RisApiDocumentReference {
  Data?: {
    Metadaten?: {
      Technisch?: {
        ID?: string;
        Applikation?: string;
      };
      Allgemein?: {
        DokumentUrl?: string;
        Veroeffentlicht?: string;
        Geaendert?: string;
      };
      Bundesrecht?: {
        Kurztitel?: string;
        Titel?: string;
        Eli?: string;
        BrKons?: {
          Kundmachungsorgan?: string;
          Typ?: string;
          Dokumenttyp?: string;
          ArtikelParagraphAnlage?: string;
          Paragraphnummer?: string;
          Abkuerzung?: string;
          Gesetzesnummer?: string;
          GesamteRechtsvorschriftUrl?: string;
          Eli?: string;
        };
      };
      Landesrecht?: {
        Kurztitel?: string;
        Titel?: string;
        Bundesland?: string;
        LrKons?: {
          Kundmachungsorgan?: string;
          Typ?: string;
          Dokumenttyp?: string;
          ArtikelParagraphAnlage?: string;
          Paragraphnummer?: string;
          Gesetzesnummer?: string;
          GesamteRechtsvorschriftUrl?: string;
          Eli?: string;
        };
      };
      Gemeinden?: {
        Kurztitel?: string;
        Titel?: string;
        Bundesland?: string;
        Gemeinde?: string;
        Typ?: string;
        Geschaeftszahl?: { item?: string | string[] };
        Gr?: {
          Bezirk?: string;
          Inkrafttretensdatum?: string;
          Indizes?: { item?: string | string[] };
        };
        GrA?: {
          Bezirk?: string;
          KundmachungsorganNr?: string;
          Kundmachungsdatum?: string;
        };
      };
    };
    Dokumentliste?: {
      ContentReference?: {
        ContentType?: string;
        Name?: string;
        Urls?: {
          ContentUrl?: RisApiContentUrl | RisApiContentUrl[];
        };
      } | {
        ContentType?: string;
        Name?: string;
        Urls?: {
          ContentUrl?: RisApiContentUrl | RisApiContentUrl[];
        };
      }[];
    };
  };
}

export interface RisApiHitsMeta {
  totalHits?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface RisApiSearchResponseEnvelope {
  OgdSearchResult?: {
    Error?: {
      Applikation?: string;
      Message?: string;
    };
    OgdDocumentResults?: {
      Hits?: {
        "@pageNumber"?: string;
        "@pageSize"?: string;
        "#text"?: string;
      };
      OgdDocumentReference?: RisApiDocumentReference | RisApiDocumentReference[];
    };
  };
}
