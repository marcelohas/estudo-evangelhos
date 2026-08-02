import catalogData from "../../content/generated/catalog-pt-BR.json";
import matthew141321 from "../../content/curated/mateus-14-13-21.pt-BR.json";
import { normalizeSearchText } from "./search";

export type CatalogComment = { author: string; text: string };

export type CatalogRecord = {
  id: string;
  book: "Mateus" | "Marcos" | "Lucas" | "João";
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
  gospelText: string;
  bibleText: string;
  comments: CatalogComment[];
  reviewStatus: "em_revisao";
};

export const catalog = [matthew141321, ...catalogData] as CatalogRecord[];

function referenceScore(record: CatalogRecord, query: string) {
  const reference = normalizeSearchText(record.reference);
  if (reference === query) return 100;
  if (reference.startsWith(query) || query.startsWith(reference)) return 80;
  if (reference.includes(query)) return 60;
  return 0;
}

export function searchCatalog(value: string, limit = 20) {
  const query = normalizeSearchText(value);
  if (!query) return [];

  return catalog
    .map((record) => {
      const byReference = referenceScore(record, query);
      const text = normalizeSearchText([
        record.bibleText,
        record.gospelText,
        ...record.comments.map((comment) => `${comment.author} ${comment.text}`),
      ].join(" "));
      const byText = text.includes(query) ? 20 : 0;
      return { record, score: Math.max(byReference, byText) };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.record.chapter - b.record.chapter || a.record.verseStart - b.record.verseStart)
    .slice(0, limit)
    .map((result) => result.record);
}
