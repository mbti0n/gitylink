import { NextResponse } from "next/server";
import { getGitHubRepositories } from "@/lib/github-repositories";
import { getOAuthSession } from "@/lib/provider-auth";

type SpotifyTokenResponse = {
  access_token?: string;
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  external_urls: { spotify: string };
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyTrack[];
  };
};

type GenreMatch = {
  genre: string;
  evidence: string[];
  score: number;
};

const languageGenres: Record<string, string> = {
  TypeScript: "indie electronic",
  JavaScript: "indie electronic",
  Python: "lo-fi hip-hop",
  Rust: "post-rock",
  Go: "indie rock",
  Java: "jazz fusion",
  "C++": "progressive metal",
  "C#": "synthwave",
  Ruby: "garage rock",
  Swift: "dream pop",
  HTML: "indie pop",
  CSS: "indie pop",
};

const repositoryThemes = [
  {
    pattern: /\b(ai|machine learning|neural|llm|data|analytics)\b/i,
    genre: "glitch",
    evidence: "AI and data projects",
  },
  {
    pattern: /\b(game|gaming|unity|unreal)\b/i,
    genre: "chiptune",
    evidence: "game development",
  },
  {
    pattern: /\b(design|ui|ux|frontend|web|visual)\b/i,
    genre: "dream pop",
    evidence: "web and design projects",
  },
  {
    pattern: /\b(cloud|devops|infra|kubernetes|docker)\b/i,
    genre: "minimal techno",
    evidence: "infrastructure projects",
  },
  {
    pattern: /\b(security|crypto|privacy|auth)\b/i,
    genre: "industrial",
    evidence: "security and privacy projects",
  },
];

function getGenreMatches(
  repositories: NonNullable<Awaited<ReturnType<typeof getGitHubRepositories>>>,
) {
  const matches = new Map<string, GenreMatch>();
  const addEvidence = (genre: string, evidence: string, score: number) => {
    const match = matches.get(genre) ?? { genre, evidence: [], score: 0 };
    match.score += score;
    if (!match.evidence.includes(evidence)) match.evidence.push(evidence);
    matches.set(genre, match);
  };

  const languageCounts = new Map<string, number>();
  for (const repository of repositories) {
    if (!repository.language) continue;
    languageCounts.set(
      repository.language,
      (languageCounts.get(repository.language) ?? 0) + 1,
    );
  }

  for (const [language, count] of languageCounts) {
    addEvidence(
      languageGenres[language] ?? "instrumental hip-hop",
      `${count} ${language} ${count === 1 ? "project" : "projects"}`,
      count * 2,
    );
  }

  for (const repository of repositories) {
    const details = `${repository.name} ${repository.description ?? ""}`;
    for (const theme of repositoryThemes) {
      if (theme.pattern.test(details)) {
        addEvidence(theme.genre, theme.evidence, 2);
      }
    }
  }

  return [...matches.values()]
    .sort((first, second) => second.score - first.score || first.genre.localeCompare(second.genre))
    .slice(0, 3)
    .map(({ genre, evidence }) => ({ genre, reason: evidence.join(" · ") }));
}

async function getSpotifyAccessToken(clientId: string, clientSecret: string) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Spotify access token request failed.", response.status);
    throw new Error("Spotify could not authorize this request.");
  }

  const tokenData = (await response.json()) as SpotifyTokenResponse;
  if (!tokenData.access_token) {
    throw new Error("Spotify returned an invalid access token.");
  }
  return tokenData.access_token;
}

async function searchTracks(token: string, genre: string) {
  const offset = Math.floor(Math.random() * 31);
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=20&offset=${offset}&q=${encodeURIComponent(`${genre} music`)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error(`Spotify track search failed for ${genre}.`, response.status);
    throw new Error("Spotify could not find track recommendations.");
  }

  const searchData = (await response.json()) as SpotifySearchResponse;
  const candidates = searchData.tracks?.items ?? [];
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [
      candidates[randomIndex],
      candidates[index],
    ];
  }

  return candidates.slice(0, 3).map((track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => artist.name),
    album: track.album.name,
    imageUrl: track.album.images[0]?.url ?? null,
    spotifyUrl: track.external_urls.spotify,
  }));
}

export async function POST() {
  if (!(await getOAuthSession())) {
    return NextResponse.json(
      { error: "Connect GitHub before getting music recommendations." },
      { status: 401 },
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Configure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to find tracks." },
      { status: 503 },
    );
  }

  const repositories = await getGitHubRepositories();
  if (!repositories) {
    return NextResponse.json(
      { error: "Could not load your GitHub repositories. Try again shortly." },
      { status: 502 },
    );
  }

  const genres = getGenreMatches(repositories);
  if (genres.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  try {
    const token = await getSpotifyAccessToken(clientId, clientSecret);
    const recommendations = await Promise.all(
      genres.map(async ({ genre, reason }) => ({
        genre,
        reason,
        tracks: await searchTracks(token, genre),
      })),
    );
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Spotify recommendations failed.", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load Spotify recommendations. Try again shortly.",
      },
      { status: 502 },
    );
  }
}
