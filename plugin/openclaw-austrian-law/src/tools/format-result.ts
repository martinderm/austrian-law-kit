import type { ToolResult } from "../types/shared.js";
import type { LegalReviewResponse } from "../types/tool-contracts.js";

export type ToolContentMessage = {
  content: Array<{ type: "text"; text: string }>;
};

export function formatToolResult<T>(result: ToolResult<T>): ToolContentMessage {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

export function formatLegalReviewMarkdown(review: LegalReviewResponse): string {
  const receipt = review.metadata.verification_receipt;
  const sections: string[] = [];

  // A) Normwortlaut
  sections.push(
    `### A) Normwortlaut (${review.metadata.title || "RIS-Fundstelle"})\n\n` +
      `> ${review.norm_text.split("\n").join("\n> ")}`
  );

  // B) Metadaten & Verification Receipt
  const receiptLines = [
    `- **Dokumentnummer / Source ID:** \`${receipt.dokumentnummer || receipt.source_id || "n/a"}\``,
    receipt.gesetzesnummer ? `- **Gesetzesnummer:** \`${receipt.gesetzesnummer}\`` : null,
    receipt.eli ? `- **ELI:** [${receipt.eli}](${receipt.eli})` : null,
    receipt.paragraf ? `- **Paragraf / Abschnitt:** ${receipt.paragraf}` : null,
    `- **Geltender Fassungsstand / Stichtag:** ${receipt.consolidated_as_of || receipt.stichtag || "tagesaktuell"}`,
    receipt.effective_from ? `- **Inkrafttretedatum:** ${receipt.effective_from}` : null,
    receipt.effective_to ? `- **Außerkrafttretedatum:** ${receipt.effective_to}` : null,
    receipt.kundmachungsorgan ? `- **Kundmachungsorgan:** ${receipt.kundmachungsorgan}` : null,
    `- **Content SHA-256:** \`${receipt.content_sha256}\``,
    `- **Abrufmethode:** \`${receipt.retrieval_method}\``,
    `- **Verifikationsstatus:** \`${receipt.verification_status}\``,
    receipt.fallback_reason ? `- **Fallback-Begründung:** ${receipt.fallback_reason}` : null,
    receipt.warning ? `- **Warnung:** ⚠️ ${receipt.warning}` : null,
  ].filter(Boolean);

  sections.push(`### B) Metadaten & Verification Receipt\n\n${receiptLines.join("\n")}`);

  // C) Paraphrase
  if (review.paraphrase) {
    sections.push(`### C) Verständliche Zusammenfassung\n\n${review.paraphrase}`);
  }

  // D) Judikatur
  if (review.judicature && review.judicature.length > 0) {
    const judiLines = review.judicature.map((j) => {
      const header = j.case_number ? `**${j.court || "OGH"} ${j.case_number}** (${j.decision_date || "o.D."}): ${j.title}` : `**${j.title}**`;
      const link = j.url ? ` [RIS-Link](${j.url})` : "";
      const summary = j.summary ? `\n  ${j.summary}` : "";
      return `- ${header}${link}${summary}`;
    });
    sections.push(`### D) Judikatur & Leitsätze (Sekundärkontext)\n\n${judiLines.join("\n")}`);
  }

  // E) Schlussfolgerung / Grenzen
  if (review.conclusion) {
    sections.push(`### E) Schlussfolgerung & Rechtsunsicherheit\n\n${review.conclusion}`);
  }

  return sections.join("\n\n---\n\n");
}
