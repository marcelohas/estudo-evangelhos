import { normalizeSearchText } from "./search";

export type EscrivaPoint = {
  id: number;
  number: number;
  label: string;
  text: string;
  public_url: string;
  chapter: { name: string };
  book: { name: string };
};

const pointBySearch = new Map([
  "Mateus 14,13-21",
  "Marcos 6,30-44",
  "Lucas 9,10-17",
  "João 6,1-15",
  "multiplicação dos pães",
].map((value) => [normalizeSearchText(value), 69925]));

export async function fetchEscrivaPoint(value: string): Promise<EscrivaPoint | null> {
  const pointId = pointBySearch.get(normalizeSearchText(value));
  if (!pointId) return null;

  const response = await fetch(`https://escriva.org/api/v1/points/${pointId}/`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Escriva.org respondeu com ${response.status}`);
  return response.json() as Promise<EscrivaPoint>;
}
