const ANILIST_API = "https://graphql.anilist.co";

type AiringEpisode = {
  episode: number;
  airingAt: number;
};

type MediaType = "ANIME" | "MANGA";

type MediaInfo = {
  id: number;
  idMal: number | null;
  title: {
    userPreferred: string;
  };
  nextAiringEpisode: AiringEpisode | null;
  chapters: number | null;
};

async function anilistRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList request failed (${response.status})`);
  }

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "AniList request failed");
  }

  if (!payload.data) {
    throw new Error("AniList response was empty");
  }

  return payload.data;
}

export async function importAniListUsername(userName: string) {
  return importAniListMediaList(userName, "ANIME");
}

export async function importAniListMediaList(userName: string, mediaType: MediaType) {
  const query = `
    query ($userName: String!, $mediaType: MediaType!) {
      MediaListCollection(userName: $userName, type: $mediaType) {
        lists {
          entries {
            status
            media {
              id
              idMal
              title {
                userPreferred
              }
            }
          }
        }
      }
    }
  `;

  const data = await anilistRequest<{
    MediaListCollection: {
      lists: Array<{
        entries: Array<{
          status: string;
          media: { id: number; idMal: number | null; title: { userPreferred: string } };
        }>;
      }>;
    } | null;
  }>(query, { userName, mediaType });

  const allowedStatuses = mediaType === "MANGA" ? ["CURRENT", "PLANNING", "REREADING"] : ["CURRENT", "PLANNING", "REPEATING"];
  const lists = data.MediaListCollection?.lists ?? [];
  return lists.flatMap((list) =>
    list.entries
      .filter((entry) => allowedStatuses.includes(entry.status))
      .map((entry) => ({
        source: "ANILIST" as const,
        sourceId: String(entry.media.id),
        malId: entry.media.idMal,
        title: entry.media.title.userPreferred,
      })),
  );
}

export async function searchAiringInfo(title: string) {
  return searchMediaInfo(title, "ANIME");
}

export async function searchMediaInfo(title: string, mediaType: MediaType) {
  const query = `
    query ($search: String!, $mediaType: MediaType!) {
      Media(search: $search, type: $mediaType, sort: POPULARITY_DESC) {
        id
        idMal
        title {
          userPreferred
        }
        nextAiringEpisode {
          episode
          airingAt
        }
        chapters
      }
    }
  `;

  const data = await anilistRequest<{ Media: MediaInfo | null }>(query, { search: title, mediaType });
  return data.Media;
}

export async function fetchAiringInfoById(id: string) {
  return fetchMediaInfoById(id, "ANIME");
}

export async function fetchMediaInfoById(id: string, mediaType: MediaType) {
  const query = `
    query ($id: Int!, $mediaType: MediaType!) {
      Media(id: $id, type: $mediaType) {
        id
        idMal
        title {
          userPreferred
        }
        nextAiringEpisode {
          episode
          airingAt
        }
        chapters
      }
    }
  `;

  const data = await anilistRequest<{ Media: MediaInfo | null }>(query, { id: Number(id), mediaType });
  return data.Media;
}