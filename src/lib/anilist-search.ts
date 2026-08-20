const ANILIST_API = "https://graphql.anilist.co";

const SEARCH_QUERY = `
  query ($search: String, $type: MediaType) {
    Media(search: $search, type: $type, isAdult: false) {
      id
      siteUrl
      title {
        romaji
      }
      coverImage {
        large
      }
      status(version: 2)
      description(asHtml: true)
      averageScore
    }
  }
`;

import TurndownService from "turndown";

const turndownService = new TurndownService();
turndownService.remove("span");

const anilistLogo = "https://anilist.co/img/logo_al.png";

const capitalize = (str: string) =>
  str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");

const shorten = (str: string) => {
  const markdown = turndownService.turndown(str);
  if (markdown.length > 400) {
    return markdown.substring(0, 400) + "...";
  }
  return markdown;
};

interface MediaResult {
  id: number;
  siteUrl: string;
  title: {
    romaji: string;
  };
  coverImage: {
    large: string | null;
  } | null;
  status: string | null;
  description: string | null;
  averageScore: number | null;
}

interface SearchResponse {
  Media: MediaResult | null;
  error?: {
    message: string;
  };
}

interface SearchError {
  error: {
    message: string;
  };
}

interface SearchResult {
  name: string;
  url: string;
  imageUrl: string | null;
  description: string;
  footer: string;
  title: string;
}

export type { SearchError, SearchResult };

async function anilistRequest(query: string, variables: Record<string, unknown>): Promise<SearchResponse> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList request failed (${response.status})`);
  }

  const payload = (await response.json()) as { data?: SearchResponse; errors?: Array<{ message: string }> };
  if (payload.errors?.length) {
    return { Media: null, error: { message: payload.errors[0]?.message ?? "AniList request failed" } };
  }

  if (!payload.data) {
    return { Media: null, error: { message: "AniList response was empty" } };
  }

  return payload.data;
}

export async function searchAnimeManga(title: string, type: "ANIME" | "MANGA"): Promise<SearchResult | SearchError> {
  const data = await anilistRequest(SEARCH_QUERY, { search: title, type });

  if (data.error) {
    return { error: data.error };
  }

  const media = data.Media;
  if (!media) {
    return { error: { message: `No ${type.toLowerCase()} found for "${title}"` } };
  }

  const { averageScore: score, status } = media;

  const scoreString = score != null ? `Score: ${score}%` : "";
  const statusString = status != null ? `Status: ${capitalize(status)}` : "";

  let footer = "";
  if (score) footer += scoreString + "  ";
  if (status) footer += statusString;

  return {
    name: media.title.romaji,
    url: media.siteUrl,
    imageUrl: media.coverImage?.large ?? null,
    description: media.description ?? "",
    footer: footer,
    title: media.title.romaji,
  };
}