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
  uri: string;
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyTrack[];
  };
};

export type SpotifyTrackResult = {
  id: string;
  name: string;
  artists: string[];
  album: string;
  imageUrl: string | null;
  spotifyUrl: string;
  spotifyEmbedUrl: string;
};

export async function getSpotifyAccessToken(clientId: string, clientSecret: string) {
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

export async function searchSpotifyTracks(
  token: string,
  query: string,
  limit = 3,
  offset = 0,
): Promise<SpotifyTrackResult[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=${limit}&offset=${offset}&q=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error("Spotify track search failed.", response.status);
    throw new Error("Spotify could not find track recommendations.");
  }

  const searchData = (await response.json()) as SpotifySearchResponse;
  return (searchData.tracks?.items ?? []).map((track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => artist.name),
    album: track.album.name,
    imageUrl: track.album.images[0]?.url ?? null,
    spotifyUrl: track.external_urls.spotify,
    spotifyEmbedUrl: `https://open.spotify.com/embed/track/${encodeURIComponent(track.id)}?utm_source=generator`,
  }));
}
