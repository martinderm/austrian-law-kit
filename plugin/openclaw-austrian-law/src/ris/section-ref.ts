export function extractSectionNumber(sectionRef?: string, fallback?: string): string | undefined {
  const match = sectionRef
    ?.trim()
    .match(/^(?:§|Art\.?)\s*([0-9]+[a-zA-Z]?)(?=\s|[.)/:,;-]|$)/i);
  const value = match?.[1] ?? fallback?.trim();
  return value ? value.toLowerCase() : undefined;
}
