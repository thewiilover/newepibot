type TrackField = {
  name: string;
  value: string;
  inline?: boolean;
};

function formatValue(value: string | number | boolean | null | undefined) {
  if (value === null || typeof value === "undefined" || value === "") return "N/A";
  return String(value);
}

function chunkFields(fields: TrackField[], maxFields = 25) {
  const chunks: TrackField[][] = [];
  for (let index = 0; index < fields.length; index += maxFields) {
    chunks.push(fields.slice(index, index + maxFields));
  }
  return chunks;
}

export function buildAnimeTestPingEmbeds(tracks: Array<Record<string, any>>) {
  const baseFields: TrackField[] = tracks.length
    ? tracks.flatMap((track, index) => [
        {
          name: `${index + 1}. ${track.title}`,
          value: [
            `Source: ${formatValue(track.source)}`,
            `Source ID: ${formatValue(track.sourceId)}`,
            `Next episode: ${formatValue(track.nextEpisode)}`,
            `Next airing at: ${track.nextAiringAt ? new Date(track.nextAiringAt).toISOString() : "N/A"}`,
            `Last notified episode: ${formatValue(track.lastNotifiedEpisode)}`,
            `Status: ${formatValue(track.status)}`,
          ].join("\n"),
        },
      ])
    : [
        {
          name: "Tracked anime",
          value: "No anime are currently tracked.",
        },
      ];

  return chunkFields(baseFields).map((fields, index) => ({
    title: index === 0 ? "Anime test ping" : `Anime test ping continued ${index + 1}`,
    description: index === 0 ? `Tracked anime count: ${tracks.length}` : undefined,
    color: 0x38bdf8,
    fields,
    timestamp: new Date().toISOString(),
  }));
}

export function buildMangaTestPingEmbeds(tracks: Array<Record<string, any>>) {
  const baseFields: TrackField[] = tracks.length
    ? tracks.flatMap((track, index) => [
        {
          name: `${index + 1}. ${track.title}`,
          value: [
            `Source: ${formatValue(track.source)}`,
            `Source ID: ${formatValue(track.sourceId)}`,
            `MAL ID: ${formatValue(track.malId)}`,
            `Chapter count: ${formatValue(track.chapterCount)}`,
            `Last notified chapter: ${formatValue(track.lastNotifiedChapter)}`,
          ].join("\n"),
        },
      ])
    : [
        {
          name: "Tracked manga",
          value: "No manga are currently tracked.",
        },
      ];

  return chunkFields(baseFields).map((fields, index) => ({
    title: index === 0 ? "Manga test ping" : `Manga test ping continued ${index + 1}`,
    description: index === 0 ? `Tracked manga count: ${tracks.length}` : undefined,
    color: 0xf59e0b,
    fields,
    timestamp: new Date().toISOString(),
  }));
}