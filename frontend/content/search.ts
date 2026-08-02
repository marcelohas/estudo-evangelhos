import { harmonies, type Evangelist, type Harmony } from "./harmonies";

export type SearchResult = {
  harmony: Harmony;
  evangelist: Evangelist;
};

const bookAliases: Record<string, string> = {
  mt: "mateus",
  mat: "mateus",
  mc: "marcos",
  mr: "marcos",
  lc: "lucas",
  luc: "lucas",
  jo: "joao",
  joao: "joao",
  joh: "joao",
};

export function normalizeSearchText(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(mt|mat|mc|mr|lc|luc|jo|joh)\b/g, (alias) => bookAliases[alias] ?? alias)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return bookAliases[normalized] ?? normalized;
}

function matches(candidate: string, query: string) {
  const normalizedCandidate = normalizeSearchText(candidate);
  return normalizedCandidate === query || normalizedCandidate.includes(query) || query.includes(normalizedCandidate);
}

export function searchHarmonies(value: string): SearchResult[] {
  const query = normalizeSearchText(value);
  if (!query) return [];

  const results: SearchResult[] = [];

  for (const harmony of harmonies) {
    const gospel = harmony.catena.find((card) => matches(card.reference, query));
    if (gospel) {
      results.push({ harmony, evangelist: gospel.evangelist });
      continue;
    }

    const primaryBook = normalizeSearchText(harmony.primary.evangelist);
    const bookOnlyMatch = query === primaryBook || harmony.catena.some(
      (card) => normalizeSearchText(card.evangelist) === query,
    );
    const textualMatch = [harmony.title, harmony.shortTitle, ...harmony.aliases].some(
      (candidate) => matches(candidate, query),
    );

    if (bookOnlyMatch || textualMatch) {
      const matchingCard = harmony.catena.find(
        (card) => normalizeSearchText(card.evangelist) === query,
      );
      results.push({
        harmony,
        evangelist: matchingCard?.evangelist ?? harmony.primary.evangelist,
      });
    }
  }

  return results;
}
