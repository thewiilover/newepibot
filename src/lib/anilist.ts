const ANILIST_API = "https://graphql.anilist.co";

type AiringEpisode = {
  episode: number;
  airingAt: number;
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
  const query = `
    query ($userName: String!) {
      MediaListCollection(userName: $userName, type: ANIME) {
        lists {
          entries {
            status
            media {
              id
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
    MediaListCollection: { lists: Array<{ entries: Array<{ status: string; media: { id: number; title: { userPreferred: string } } }> }> } | null;
  }>(query, { userName });

  const lists = data.MediaListCollection?.lists ?? [];
  return lists.flatMap((list) =>
    list.entries
      .filter((entry) => ["CURRENT", "PLANNING", "REPEATING"].includes(entry.status))
      .map((entry) => ({
        source: "ANILIST" as const,
        sourceId: String(entry.media.id),
        title: entry.media.title.userPreferred,
      })),
  );
}

export async function searchAiringInfo(title: string) {
  const query = `
    query ($search: String!) {
      Media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        title {
          userPreferred
        }
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  `;

  const data = await anilistRequest<{ Media: { id: number; title: { userPreferred: string }; nextAiringEpisode: AiringEpisode | null } | null }>(query, { search: title });
  return data.Media;
}

export async function fetchAiringInfoById(id: string) {
  const query = `
    query ($id: Int!) {
      Media(id: $id, type: ANIME) {
        id
        title {
          userPreferred
        }
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  `;

  const data = await anilistRequest<{ Media: { id: number; title: { userPreferred: string }; nextAiringEpisode: AiringEpisode | null } | null }>(query, { id: Number(id) });
  return data.Media;
}