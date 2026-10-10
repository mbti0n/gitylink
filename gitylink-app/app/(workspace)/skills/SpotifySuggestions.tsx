"use client";

import { useState } from "react";

type Recommendation = {
  genre: string;
  reason: string;
  tracks: {
    id: string;
    name: string;
    artists: string[];
    album: string;
    imageUrl: string | null;
    spotifyUrl: string;
  }[];
};

export default function SpotifySuggestions() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function findTracks() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/spotify-recommendations", {
        method: "POST",
      });
      const result = (await response.json()) as {
        recommendations?: Recommendation[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Could not load Spotify recommendations.");
      }
      setRecommendations(result.recommendations ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load Spotify recommendations.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="spotify-panel" aria-labelledby="spotify-heading">
      <div className="spotify-panel-heading">
        <div>
          <p className="record-eyebrow">SIDE B · THE SOUND</p>
          <h2 id="spotify-heading">Find your project genres</h2>
          <p>
            Spotify tracks picked from the languages and themes across your repositories.
          </p>
        </div>
        <button
          className="record-button record-button-primary spotify-find-button"
          type="button"
          onClick={() => void findTracks()}
          disabled={isLoading}
        >
          {isLoading
            ? "Finding your sound…"
            : recommendations
              ? "↻ Refresh picks"
              : "♫ Find my sound"}
        </button>
      </div>

      {error && <p className="spotify-feedback" role="alert">{error}</p>}
      {recommendations && recommendations.length === 0 && (
        <p className="spotify-feedback">
          Add repository languages or project descriptions to discover a sound.
        </p>
      )}
      {recommendations && recommendations.length > 0 && (
        <div className="spotify-genres">
          {recommendations.map((recommendation) => (
            <section
              className="spotify-genre"
              key={recommendation.genre}
              aria-label={`${recommendation.genre} recommendations`}
            >
              <div className="spotify-genre-heading">
                <div>
                  <h3>{recommendation.genre}</h3>
                  <p>{recommendation.reason}</p>
                </div>
                <span aria-hidden="true">♫</span>
              </div>
              {recommendation.tracks.length > 0 ? (
                <ul className="spotify-track-list">
                  {recommendation.tracks.map((track) => (
                    <li className="spotify-track" key={track.id}>
                      {track.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={track.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span className="spotify-track-placeholder" aria-hidden="true">♫</span>
                      )}
                      <div>
                        <strong>{track.name}</strong>
                        <span>{track.artists.join(", ")} · {track.album}</span>
                      </div>
                      <a
                        className="track-open"
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${track.name} by ${track.artists.join(", ")} on Spotify`}
                      >
                        ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="spotify-feedback">No tracks found for this genre yet.</p>
              )}
            </section>
          ))}
        </div>
      )}
      <p className="spotify-attribution">Track results powered by Spotify.</p>
    </section>
  );
}
