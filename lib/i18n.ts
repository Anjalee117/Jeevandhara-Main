import type { Farm } from "@/types";
import catalog from "@/data/translations.json";
export type Language = Farm["language"];
export const languages = [
  { code: "en", label: "English", locale: "en-IN" },
  { code: "kn", label: "ಕನ್ನಡ", locale: "kn-IN" },
  { code: "hi", label: "हिन्दी", locale: "hi-IN" },
] as const;
const normalize = (text: string) =>
  text.replace(/\s+/g, " ").trim().toLowerCase();
const phrases = new Map(
  catalog
    .filter((row) => !row[0].includes("{"))
    .map((row) => [normalize(row[0]), row]),
);
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const templates = catalog
  .filter((row) => row[0].includes("{"))
  .map((row) => ({
    row,
    pattern: new RegExp(
      "^" +
        row[0]
          .split(/\{\d+\}/)
          .map(escape)
          .join("(.+?)") +
        "$",
      "i",
    ),
  }));
export function translate(
  language: Language,
  text: string,
  kannadaText?: string,
): string {
  if (language === "en" || !text.trim()) return text;
  const index = language === "hi" ? 1 : 2;
  const normalized = text.replace(/\s+/g, " ").trim();
  const phrase = phrases.get(normalize(normalized));
  if (phrase) return phrase[index];
  for (const { row, pattern } of templates) {
    const match = normalized.match(pattern);
    if (match)
      return row[index].replace(/\{(\d+)\}/g, (_, n) =>
        translate(language, match[Number(n) + 1]),
      );
  }
  // Separators occur between independent labels and values in technical readouts.
  if (/[·→/]/.test(normalized))
    return normalized
      .split(/(\s*[·→/]\s*)/)
      .map((part, i) => (i % 2 ? part : translate(language, part)))
      .join("");
  const decorated = normalized.match(/^([↑↻✓×●:;.,\s]*)(.*?)([↗↘↓↑:;.,\s]*)$/);
  if (decorated && (decorated[1] || decorated[3])) {
    const core = phrases.get(normalize(decorated[2]));
    if (core) return decorated[1] + core[index] + decorated[3];
  }
  return language === "kn" && kannadaText ? kannadaText : text;
}
export function speechLocale(language: Language) {
  return languages.find((l) => l.code === language)?.locale ?? "en-IN";
}
