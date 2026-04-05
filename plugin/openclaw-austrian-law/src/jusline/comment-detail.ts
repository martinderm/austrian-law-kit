import { fetchHtml, parseAustrianDate, stripTags } from "./common.js";

export type CommentDetailPreview = {
  source_url: string;
  rating_value?: number;
  rating_count?: number;
  published_date?: string;
  published_date_raw?: string;
  views_count?: number;
  comment_version?: string;
  author_name?: string;
  author_profile_url?: string;
  citation?: string;
  body_markdown?: string;
  fetch_error?: string;
};

export async function fetchCommentDetailPreview(url: string): Promise<CommentDetailPreview> {
  try {
    const html = await fetchHtml(url);
    const ratingMatch = html.match(/([0-9]+,[0-9])\s+bei\s+(\d+)\s+Bewertungen/i);
    const versionMatch = html.match(/<!-- Versions Nummer ausgeben -->\s*([^|<]+?)\s*\|/i);
    const viewsMatch = html.match(/fa-eye[^>]*><\/i>\s*(\d+)\s*Aufrufe/i);
    const dateMatch = html.match(/fa-clock-o[^>]*><\/i>\s*([0-9]{2}\.[0-9]{2}\.[0-9]{2,4})/i);
    const authorMatch = html.match(/autoren-profil\/(\d+)[^>]*>([^<]+)<\/a>/i);
    const citationMatch = html.match(/<b>Zitiervorschlag:<\/b>\s*([^<]+)/i);
    const bodyMatch = html.match(/<ul class="rating[\s\S]*?<hr>([\s\S]*?)<hr>\s*<div class="text-right small">/i);
    const bodyMarkdown = bodyMatch?.[1] ? stripTags(bodyMatch[1]) : undefined;
    const parsedDate = parseAustrianDate(dateMatch?.[1]);

    return {
      source_url: url,
      ...(ratingMatch ? { rating_value: Number(ratingMatch[1].replace(",", ".")), rating_count: Number(ratingMatch[2]) } : {}),
      ...(parsedDate.iso ? { published_date: parsedDate.iso } : {}),
      ...(parsedDate.raw ? { published_date_raw: parsedDate.raw } : {}),
      ...(viewsMatch ? { views_count: Number(viewsMatch[1]) } : {}),
      ...(versionMatch ? { comment_version: stripTags(versionMatch[1]) } : {}),
      ...(authorMatch ? { author_name: stripTags(authorMatch[2]), author_profile_url: `https://www.jusline.at/autoren-profil/${authorMatch[1]}` } : {}),
      ...(citationMatch ? { citation: stripTags(citationMatch[1]) } : {}),
      ...(bodyMarkdown ? { body_markdown: bodyMarkdown } : {}),
    };
  } catch (error) {
    return { source_url: url, fetch_error: error instanceof Error ? error.message : String(error) };
  }
}

export function hasUsefulCommentDetail(detail: CommentDetailPreview, snippet: string | null): boolean {
  return Boolean(
    detail.body_markdown
    || detail.rating_value != null
    || detail.published_date
    || detail.author_name
    || detail.citation
    || snippet,
  );
}
