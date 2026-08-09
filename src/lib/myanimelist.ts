import { XMLParser } from "fast-xml-parser";

type MalAnimeEntry = {
  series_title?: string;
  my_status?: string | number;
};

export function importMyAnimeListXml(xmlText: string) {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const parsed = parser.parse(xmlText) as { myanimelist?: { anime?: MalAnimeEntry | MalAnimeEntry[] } };
  const entries = parsed.myanimelist?.anime;
  const animeEntries = Array.isArray(entries) ? entries : entries ? [entries] : [];

  return animeEntries
    .filter((entry) => {
      const status = String(entry.my_status ?? "").toLowerCase();
      return status === "1" || status === "watching" || status === "6" || status === "plan to watch";
    })
    .map((entry) => ({
      source: "MYANIMELIST" as const,
      sourceId: entry.series_title ? entry.series_title.toLowerCase() : null,
      title: entry.series_title ?? "Unknown title",
    }));
}