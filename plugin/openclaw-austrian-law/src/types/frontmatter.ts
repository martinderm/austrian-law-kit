export type FassungTyp = "Arbeitsfassung" | "verbindliche Fassung";
export type SourceKind = "ris" | "jusline";
export type DocType =
  | "norm_segment"
  | "norm_document"
  | "discussion"
  | "commentary"
  | "decision";

// Basistyp gemäß docs/frontmatter-schema.md (Pflichtfelder explizit).
export interface FrontmatterBase {
  stable_id: string;
  source: SourceKind;
  source_url: string;
  doc_type: DocType;
  title: string;
  fetched_at: string; // ISO-8601 datetime
  version_label: string; // technische/inhaltliche Fassungsbezeichnung
  fassung_typ: FassungTyp; // rechtlicher Status der Fassung

  // optionale Felder (bewusst generisch gehalten in der Scaffold-Phase)
  source_id?: string;
  effective_date?: string;
  published_date?: string;
  language?: string;
  jurisdiction?: string;
  segment_ref?: string;
  norm_ref?: string;
  decision_ref?: string;
  supersedes?: string;
  checksum?: string;
  notes?: string;
}
