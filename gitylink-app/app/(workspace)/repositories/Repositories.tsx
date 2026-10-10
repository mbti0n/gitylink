"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BeatCat from "@/components/BeatCat";
import RepositoryAlbumArt from "@/components/RepositoryAlbumArt";
import type { GitHubRepository } from "@/lib/github-repositories";

type AlbumSoundtrack = {
  impression: string;
  genres: { name: string; mood: string }[];
  tracks: {
    id: string;
    name: string;
    artists: string[];
    album: string;
    imageUrl: string | null;
    spotifyUrl: string;
    spotifyEmbedUrl: string;
  }[];
};

export default function Repositories({
  repositories,
}: {
  repositories: GitHubRepository[] | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const [openRepositoryId, setOpenRepositoryId] = useState<number | null>(null);
  const [loadingRepositoryId, setLoadingRepositoryId] = useState<number | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [soundtracks, setSoundtracks] = useState<Record<number, AlbumSoundtrack>>({});
  const [soundtrackErrors, setSoundtrackErrors] = useState<Record<number, string>>({});
  const filteredRepositories = useMemo(
    () =>
      (repositories ?? []).filter((repository) =>
        `${repository.name} ${repository.language ?? ""} ${repository.description ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [repositories, query],
  );

  async function toggleSoundtrack(repositoryId: number) {
    if (openRepositoryId === repositoryId) {
      setOpenRepositoryId(null);
      return;
    }

    setOpenRepositoryId(repositoryId);
    if (soundtracks[repositoryId]) return;

    setLoadingRepositoryId(repositoryId);
    setSoundtrackErrors((current) => {
      const next = { ...current };
      delete next[repositoryId];
      return next;
    });
    try {
      const response = await fetch("/api/repository-soundtrack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId }),
      });
      const result = (await response.json()) as {
        soundtrack?: AlbumSoundtrack;
        error?: string;
      };
      if (!response.ok || !result.soundtrack) {
        throw new Error(result.error || "Could not build this album’s soundtrack.");
      }
      setSoundtracks((current) => ({
        ...current,
        [repositoryId]: result.soundtrack!,
      }));
    } catch (requestError) {
      setSoundtrackErrors((current) => ({
        ...current,
        [repositoryId]:
          requestError instanceof Error
            ? requestError.message
            : "Could not build this album’s soundtrack.",
      }));
    } finally {
      setLoadingRepositoryId((current) =>
        current === repositoryId ? null : current,
      );
    }
  }

  return (
    <div className="record-page">
      <header className="record-page-heading">
        <div>
          <p className="record-eyebrow">Your record shelf</p>
          <h1>Repository albums</h1>
          <p>
            Every repo has a sound. Select an album title for its AI-imagined genres and Spotify soundtrack.
          </p>
        </div>
        <div className="record-page-stamp" aria-hidden="true">VOL. 01</div>
      </header>

      <div className="record-toolbar">
        <label className="record-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search repository albums"
            placeholder="Find an album..."
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span className="record-count">
          {repositories === null
            ? "Waiting for GitHub"
            : `${repositories.length} ${repositories.length === 1 ? "album" : "albums"} in rotation`}
        </span>
        <button
          className="record-sync"
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Syncing…" : "↻ Sync shelf"}
        </button>
      </div>

      {repositories === null ? (
        <div className="record-empty">
          <BeatCat mood="confused" />
          <h2>Your shelf is waiting for GitHub</h2>
          <p>Connect your account on the overview page to bring your repositories into rotation.</p>
        </div>
      ) : filteredRepositories.length === 0 ? (
        <div className="record-empty">
          <BeatCat mood="confused" />
          <h2>{query ? "No albums found" : "Nothing on the shelf yet"}</h2>
          <p>{query ? "Try a different search." : "Public repositories you own will show up here."}</p>
        </div>
      ) : (
        <div className="album-grid">
          {filteredRepositories.map((repository, index) => (
            <article className="album-card" key={repository.id}>
              <RepositoryAlbumArt repository={repository} />
              <div className="album-card-copy">
                <div className="album-card-overline">
                  <span>NO. {String(index + 1).padStart(2, "0")}</span>
                  <span>{repository.language || "INSTRUMENTAL"}</span>
                </div>
                <h2>
                  <button
                    className="album-title-button"
                    type="button"
                    aria-expanded={openRepositoryId === repository.id}
                    aria-controls={`soundtrack-${repository.id}`}
                    onClick={() => void toggleSoundtrack(repository.id)}
                  >
                    {repository.name}
                  </button>
                </h2>
                <p>{repository.description || "An untitled project, waiting for its liner notes."}</p>
                <div className="album-card-meta">
                  <span>★ {repository.stars}</span>
                  <span>⑂ {repository.forks}</span>
                  <span>
                    Updated {new Date(repository.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                  <a href={repository.url} target="_blank" rel="noreferrer">
                    Open repo ↗
                  </a>
                </div>
                {openRepositoryId === repository.id && (
                  <div
                    className="album-soundtrack"
                    id={`soundtrack-${repository.id}`}
                    aria-live="polite"
                  >
                    {loadingRepositoryId === repository.id ? (
                      <p className="album-soundtrack-feedback">
                        Reading the project’s vibe and picking tracks…
                      </p>
                    ) : soundtrackErrors[repository.id] ? (
                      <p className="album-soundtrack-error" role="alert">
                        {soundtrackErrors[repository.id]}
                      </p>
                    ) : soundtracks[repository.id] ? (
                      <>
                        <p className="record-eyebrow">AI IMPRESSION</p>
                        <p className="album-soundtrack-impression">
                          {soundtracks[repository.id].impression}
                        </p>
                        <div className="album-soundtrack-genres">
                          {soundtracks[repository.id].genres.map((genre) => (
                            <span key={genre.name}>
                              <strong>{genre.name}</strong> · {genre.mood}
                            </span>
                          ))}
                        </div>
                        {soundtracks[repository.id].tracks.length > 0 ? (
                          <ol className="album-song-list">
                            {soundtracks[repository.id].tracks.map((track, trackIndex) => (
                              <li key={track.id}>
                                <span className="album-song-number">
                                  {String(trackIndex + 1).padStart(2, "0")}
                                </span>
                                {track.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={track.imageUrl} alt="" loading="lazy" />
                                ) : (
                                  <span className="album-song-art-placeholder" aria-hidden="true">
                                    ♫
                                  </span>
                                )}
                                <div>
                                  <strong>{track.name}</strong>
                                  <span>{track.artists.join(", ")} · {track.album}</span>
                                </div>
                                <button
                                  className="album-song-play"
                                  type="button"
                                  aria-label={`${activeTrackId === track.id ? "Close" : "Open"} Spotify player for ${track.name}`}
                                  aria-expanded={activeTrackId === track.id}
                                  onClick={() =>
                                    setActiveTrackId((current) =>
                                      current === track.id ? null : track.id,
                                    )
                                  }
                                >
                                  {activeTrackId === track.id ? "×" : "▶"}
                                </button>
                                <a
                                  href={track.spotifyUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Listen to ${track.name} by ${track.artists.join(", ")} on Spotify`}
                                >
                                  ↗
                                </a>
                                {activeTrackId === track.id && (
                                  <iframe
                                    className="album-song-player"
                                    src={track.spotifyEmbedUrl}
                                    title={`Spotify player: ${track.name} by ${track.artists.join(", ")}`}
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                  />
                                )}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="album-soundtrack-feedback">
                            Spotify didn’t return tracks for these genres.
                          </p>
                        )}
                        <p className="album-soundtrack-attribution">Tracks powered by Spotify.</p>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="cover-cost-note">
        Cover art is generated when you ask for it with your configured Gemini image model.
      </p>
    </div>
  );
}
