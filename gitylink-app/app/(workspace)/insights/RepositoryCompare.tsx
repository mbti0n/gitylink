"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { GitHubRepository } from "@/lib/github-repositories";
import {
  type RepositoryComparison,
  type RepositoryComparisonResponse,
} from "@/lib/repository-comparison";
import { getLanguageColor } from "@/lib/language-colors";
import {
  getRepositoryCoverStorageKey,
  optimizeCover,
} from "@/components/RepositoryAlbumArt";

type ComparisonMode = "owned" | "public";

type RepositoryMediaSelector =
  | { repositoryId: number }
  | { owner: string; name: string };

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

type ComparisonMediaState = {
  cover: string;
  soundtrack: AlbumSoundtrack | null;
  error: string;
};

type LanguageShare = {
  name: string;
  color: string;
  firstPercentage: number;
  secondPercentage: number;
};

export default function RepositoryCompare({
  repositories,
}: {
  repositories: GitHubRepository[];
}) {
  const [mode, setMode] = useState<ComparisonMode>("owned");
  const [firstId, setFirstId] = useState(repositories[0]?.id ?? 0);
  const [secondId, setSecondId] = useState(repositories[1]?.id ?? 0);
  const [firstPublicOwner, setFirstPublicOwner] = useState("");
  const [firstPublicName, setFirstPublicName] = useState("");
  const [secondPublicOwner, setSecondPublicOwner] = useState("");
  const [secondPublicName, setSecondPublicName] = useState("");
  const [comparison, setComparison] =
    useState<RepositoryComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const languages = useMemo(
    () => (comparison ? getLanguageShares(comparison.first, comparison.second) : []),
    [comparison],
  );

  async function compareRepositories(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setComparison(null);

    try {
      const response = await fetch("/api/compare-repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "owned"
            ? { mode, firstId, secondId }
            : {
                mode,
                first: { owner: firstPublicOwner, name: firstPublicName },
                second: { owner: secondPublicOwner, name: secondPublicName },
              },
        ),
      });
      const result = (await response.json()) as
        | RepositoryComparisonResponse
        | { error?: string };
      if (!response.ok || !("first" in result) || !("second" in result)) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Could not compare these repositories.",
        );
      }
      setComparison(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not compare these repositories. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="insights-card insights-compare" aria-labelledby="compare-title">
      <div className="insights-card-heading">
        <div>
          <p className="record-eyebrow">SIDE-BY-SIDE ANALYSIS</p>
          <h2 id="compare-title">Compare repositories</h2>
        </div>
        <span className="insights-card-note">
          Compare your projects or public repos across owners
        </span>
      </div>

      <div className="insights-compare-modes" aria-label="Comparison type">
        <button
          type="button"
          className={mode === "owned" ? "active" : ""}
          aria-pressed={mode === "owned"}
          onClick={() => {
            setMode("owned");
            setComparison(null);
            setError("");
          }}
        >
          My repositories
        </button>
        <button
          type="button"
          className={mode === "public" ? "active" : ""}
          aria-pressed={mode === "public"}
          onClick={() => {
            setMode("public");
            setComparison(null);
            setError("");
          }}
        >
          Two public repos
        </button>
      </div>

      <form
        className={`insights-compare-form${mode === "public" ? " is-public" : ""}`}
        onSubmit={compareRepositories}
      >
        {mode === "owned" ? (
          <>
            <label>
              <span>First repository</span>
              <select
                value={firstId}
                onChange={(event) => {
                  setFirstId(Number(event.target.value));
                  setComparison(null);
                }}
                required
                disabled={repositories.length === 0}
              >
                {repositories.map((repository) => (
                  <option key={repository.id} value={repository.id}>
                    {repository.name}
                  </option>
                ))}
                {repositories.length === 0 && <option value={0}>No repositories available</option>}
              </select>
            </label>
            <label>
              <span>Compare with</span>
              <select
                aria-label="Second repository"
                value={secondId}
                onChange={(event) => {
                  setSecondId(Number(event.target.value));
                  setComparison(null);
                }}
                required
                disabled={repositories.length < 2}
              >
                {repositories.length < 2 && (
                  <option value={0}>Add another public repository</option>
                )}
                {repositories.map((repository) => (
                  <option key={repository.id} value={repository.id}>
                    {repository.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <div className="insights-public-repo-pair">
            <div className="insights-public-repo-fields">
              <label>
                <span>Repository A owner</span>
                <input
                  autoComplete="off"
                  maxLength={39}
                  placeholder="e.g. vercel"
                  required
                  value={firstPublicOwner}
                  onChange={(event) => {
                    setFirstPublicOwner(event.target.value);
                    setComparison(null);
                  }}
                />
              </label>
              <label>
                <span>Repository A name</span>
                <input
                  autoComplete="off"
                  maxLength={100}
                  placeholder="e.g. next.js"
                  required
                  value={firstPublicName}
                  onChange={(event) => {
                    setFirstPublicName(event.target.value);
                    setComparison(null);
                  }}
                />
              </label>
            </div>
            <div className="insights-public-repo-fields">
              <label>
                <span>Repository B owner</span>
                <input
                  autoComplete="off"
                  maxLength={39}
                  placeholder="e.g. facebook"
                  required
                  value={secondPublicOwner}
                  onChange={(event) => {
                    setSecondPublicOwner(event.target.value);
                    setComparison(null);
                  }}
                />
              </label>
              <label>
                <span>Repository B name</span>
                <input
                  autoComplete="off"
                  maxLength={100}
                  placeholder="e.g. react"
                  required
                  value={secondPublicName}
                  onChange={(event) => {
                    setSecondPublicName(event.target.value);
                    setComparison(null);
                  }}
                />
              </label>
            </div>
          </div>
        )}

        <button
          className="record-button record-button-primary"
          type="submit"
          disabled={
            isLoading ||
            (mode === "owned" && repositories.length === 0) ||
            (mode === "owned" &&
              (repositories.length < 2 || firstId === secondId))
          }
        >
          {isLoading ? "Comparing…" : "Compare"}
          {!isLoading && <span aria-hidden="true">↗</span>}
        </button>
      </form>

      {mode === "owned" && repositories.length < 2 && (
        <p className="insights-compare-hint">
          You’ll need at least two public repositories to compare your own projects.
        </p>
      )}
      {mode === "public" && (
        <p className="insights-compare-hint">
          Enter public repositories from two different GitHub owners.
        </p>
      )}

      {error && (
        <p className="insights-compare-error" role="alert">
          {error}
        </p>
      )}

      {comparison && (
        <ComparisonResult
          first={comparison.first}
          second={comparison.second}
          languages={languages}
          firstSelector={
            mode === "owned"
              ? { repositoryId: firstId }
              : { owner: firstPublicOwner.trim(), name: firstPublicName.trim() }
          }
          secondSelector={
            mode === "owned"
              ? { repositoryId: secondId }
              : { owner: secondPublicOwner.trim(), name: secondPublicName.trim() }
          }
        />
      )}
    </section>
  );
}

function ComparisonResult({
  first,
  second,
  languages,
  firstSelector,
  secondSelector,
}: {
  first: RepositoryComparison;
  second: RepositoryComparison;
  languages: LanguageShare[];
  firstSelector: RepositoryMediaSelector;
  secondSelector: RepositoryMediaSelector;
}) {
  const [media, setMedia] = useState<Record<string, ComparisonMediaState>>({});
  const [isBuildingMedia, setIsBuildingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const firstKey = mediaKey(first.fullName);
  const secondKey = mediaKey(second.fullName);
  const firstCoverIdentifier =
    "repositoryId" in firstSelector ? firstSelector.repositoryId : first.fullName.toLowerCase();
  const secondCoverIdentifier =
    "repositoryId" in secondSelector ? secondSelector.repositoryId : second.fullName.toLowerCase();

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      const savedCovers: Record<string, string> = {};
      let storageUnavailable = false;
      for (const [key, identifier] of [
        [firstKey, firstCoverIdentifier],
        [secondKey, secondCoverIdentifier],
      ] as const) {
        try {
          savedCovers[key] =
            window.localStorage.getItem(getRepositoryCoverStorageKey(identifier)) ?? "";
        } catch {
          storageUnavailable = true;
        }
      }
      if (cancelled) return;
      setMedia((current) => {
        const next = { ...current };
        for (const [key, cover] of Object.entries(savedCovers)) {
          next[key] = {
            cover,
            soundtrack: current[key]?.soundtrack ?? null,
            error: current[key]?.error ?? "",
          };
        }
        return next;
      });
      if (storageUnavailable) {
        setMediaError("Browser storage is unavailable; generated covers may not persist.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    firstCoverIdentifier,
    firstKey,
    secondCoverIdentifier,
    secondKey,
  ]);

  async function generateMedia() {
    setIsBuildingMedia(true);
    setMediaError("");
    setMedia((current) => ({
      ...current,
      [firstKey]: { ...current[firstKey], cover: current[firstKey]?.cover ?? "", soundtrack: current[firstKey]?.soundtrack ?? null, error: "" },
      [secondKey]: { ...current[secondKey], cover: current[secondKey]?.cover ?? "", soundtrack: current[secondKey]?.soundtrack ?? null, error: "" },
    }));

    const results = await Promise.all(
      [
        { repository: first, selector: firstSelector, key: firstKey },
        { repository: second, selector: secondSelector, key: secondKey },
      ].map(async ({ repository, selector, key }) => {
        const existingCover = media[key]?.cover ?? "";
        const coverRequest = existingCover
          ? Promise.resolve(existingCover)
          : requestComparisonCover(selector);
        const soundtrackRequest = requestComparisonSoundtrack(selector);
        const [coverResult, soundtrackResult] = await Promise.allSettled([
          coverRequest,
          soundtrackRequest,
        ]);
        const errors: string[] = [];
        let cover = existingCover;
        let soundtrack: AlbumSoundtrack | null = null;

        if (coverResult.status === "fulfilled") {
          cover = coverResult.value;
          try {
            window.localStorage.setItem(
              getRepositoryCoverStorageKey(
                "repositoryId" in selector ? selector.repositoryId : repository.fullName.toLowerCase(),
              ),
              cover,
            );
          } catch {
            errors.push("Cover created but browser storage is full; it won’t persist.");
          }
        } else {
          errors.push(coverResult.reason instanceof Error
            ? `Cover: ${coverResult.reason.message}`
            : "Could not generate the album cover.");
        }
        if (soundtrackResult.status === "fulfilled") {
          soundtrack = soundtrackResult.value;
        } else {
          errors.push(soundtrackResult.reason instanceof Error
            ? `Soundtrack: ${soundtrackResult.reason.message}`
            : "Could not build the soundtrack.");
        }

        return { key, cover, soundtrack, error: errors.join(" ") };
      }),
    );
    setMedia((current) => ({
      ...current,
      ...Object.fromEntries(results.map(({ key, cover, soundtrack, error }) => [
        key,
        { cover, soundtrack, error },
      ])),
    }));
    setIsBuildingMedia(false);
  }

  return (
    <div className="insights-compare-result" aria-live="polite">
      <div className="insights-compare-repos">
        {[first, second].map((repository, index) => (
          <article
            className={`insights-compare-repo${index === 1 ? " is-second" : ""}`}
            key={`${repository.fullName}-${index}`}
          >
            <span>{index === 0 ? "REPOSITORY A" : "REPOSITORY B"}</span>
            <a href={repository.url} target="_blank" rel="noreferrer">
              {repository.fullName} <span aria-hidden="true">↗</span>
            </a>
            <p>{repository.description || "No description provided."}</p>
          </article>
        ))}
      </div>

      <div className="insights-compare-stats" aria-label="Repository statistics">
        <CompareStat label="Stars" first={first.stars} second={second.stars} />
        <CompareStat label="Forks" first={first.forks} second={second.forks} />
        <CompareStat
          label="Last updated"
          first={formatDate(first.updatedAt)}
          second={formatDate(second.updatedAt)}
        />
      </div>

      <section className="insights-language-compare" aria-labelledby="language-compare-title">
        <div className="insights-language-heading">
          <div>
            <p className="record-eyebrow">CODE COMPOSITION</p>
            <h3 id="language-compare-title">Language share</h3>
          </div>
          <div className="insights-compare-legend" aria-label="Repository colors">
            <span><i className="is-first" /> A</span>
            <span><i className="is-second" /> B</span>
          </div>
        </div>
        {languages.length === 0 ? (
          <p className="insights-no-data">
            GitHub has no language-byte data for one or both of these repositories.
          </p>
        ) : (
          <ul className="insights-language-list">
            {languages.map((language) => (
              <li className="insights-language-row" key={language.name}>
                <span className="insights-language-name">
                  <i style={{ backgroundColor: language.color }} aria-hidden="true" />
                  {language.name}
                </span>
                <span className="insights-language-bars">
                  <span className="insights-language-track">
                    <span
                      className="insights-language-fill is-first"
                      style={{ width: `${language.firstPercentage}%` }}
                    />
                  </span>
                  <span className="insights-language-track">
                    <span
                      className="insights-language-fill is-second"
                      style={{ width: `${language.secondPercentage}%` }}
                    />
                  </span>
                </span>
                <strong>
                  {language.firstPercentage}% <span>/</span> {language.secondPercentage}%
                </strong>
              </li>
            ))}
          </ul>
        )}
        <p className="insights-chart-caption">
          Percentages show GitHub-reported source bytes within each repository,
          not file counts or project quality.
        </p>
      </section>

      <section className="insights-album-compare" aria-labelledby="album-compare-title">
        <div className="insights-language-heading">
          <div>
            <p className="record-eyebrow">THE SOUND OF EACH REPO</p>
            <h3 id="album-compare-title">Album covers &amp; songlists</h3>
          </div>
          <button
            className="record-button record-button-primary"
            type="button"
            onClick={generateMedia}
            disabled={isBuildingMedia}
          >
            {isBuildingMedia ? "Making the albums…" : "Make covers & songlists"}
            {!isBuildingMedia && <span aria-hidden="true">✦</span>}
          </button>
        </div>
        <p className="insights-chart-caption">
          Covers and Spotify recommendations are created on demand from each repo’s public details.
          Generating uses your configured Gemini and Spotify services.
        </p>
        {mediaError && <p className="insights-compare-error" role="status">{mediaError}</p>}
        <div className="insights-album-grid">
          {[
            { repository: first, key: firstKey, label: "REPOSITORY A" },
            { repository: second, key: secondKey, label: "REPOSITORY B" },
          ].map(({ repository, key, label }) => {
            const repositoryMedia = media[key];
            return (
              <article className="insights-album-card" key={key}>
                <p className="record-eyebrow">{label}</p>
                <h4>{repository.fullName}</h4>
                {repositoryMedia?.cover ? (
                  <div className="insights-album-cover">
                    <Image
                      src={repositoryMedia.cover}
                      alt={`AI-generated album cover for ${repository.fullName}`}
                      fill
                      sizes="(max-width: 680px) 80vw, 280px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="insights-album-cover-placeholder">
                    <span aria-hidden="true">♫</span>
                    <span>Album cover</span>
                  </div>
                )}
                {repositoryMedia?.soundtrack ? (
                  <div className="insights-album-soundtrack">
                    <p className="record-eyebrow">AI IMPRESSION</p>
                    <p className="album-soundtrack-impression">
                      {repositoryMedia.soundtrack.impression}
                    </p>
                    <div className="album-soundtrack-genres">
                      {repositoryMedia.soundtrack.genres.map((genre) => (
                        <span key={genre.name}>
                          <strong>{genre.name}</strong> · {genre.mood}
                        </span>
                      ))}
                    </div>
                    {repositoryMedia.soundtrack.tracks.length > 0 ? (
                      <ol className="album-song-list">
                        {repositoryMedia.soundtrack.tracks.map((track, index) => {
                          const trackKey = `${key}:${track.id}`;
                          return (
                            <li key={track.id}>
                              <span className="album-song-number">{String(index + 1).padStart(2, "0")}</span>
                              {track.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={track.imageUrl} alt="" loading="lazy" />
                              ) : (
                                <span className="album-song-art-placeholder" aria-hidden="true">♫</span>
                              )}
                              <div>
                                <strong>{track.name}</strong>
                                <span>{track.artists.join(", ")} · {track.album}</span>
                              </div>
                              <button
                                className="album-song-play"
                                type="button"
                                aria-label={`${activeTrackId === trackKey ? "Close" : "Open"} Spotify player for ${track.name}`}
                                aria-expanded={activeTrackId === trackKey}
                                onClick={() => setActiveTrackId((current) => current === trackKey ? null : trackKey)}
                              >
                                {activeTrackId === trackKey ? "×" : "▶"}
                              </button>
                              <a href={track.spotifyUrl} target="_blank" rel="noreferrer" aria-label={`Listen to ${track.name} on Spotify`}>↗</a>
                              {activeTrackId === trackKey && (
                                <iframe
                                  className="album-song-player"
                                  src={track.spotifyEmbedUrl}
                                  title={`Spotify player: ${track.name}`}
                                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                  loading="lazy"
                                />
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <p className="album-soundtrack-feedback">Spotify didn’t return tracks for these genres.</p>
                    )}
                    <p className="album-soundtrack-attribution">Track suggestions powered by Spotify.</p>
                  </div>
                ) : (
                  <p className="insights-album-placeholder">
                    Generate to create this repo’s AI cover and Spotify songlist.
                  </p>
                )}
                {repositoryMedia?.error && (
                  <p className="insights-compare-error" role="alert">{repositoryMedia.error}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function mediaKey(fullName: string): string {
  return fullName.toLowerCase();
}

async function requestComparisonCover(selector: RepositoryMediaSelector): Promise<string> {
  const response = await fetch("/api/repository-cover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selector),
  });
  const result = (await response.json()) as { data?: string; mimeType?: string; error?: string };
  if (!response.ok || !result.data || !result.mimeType) {
    throw new Error(result.error || "Could not generate the album cover.");
  }
  return optimizeCover(`data:${result.mimeType};base64,${result.data}`);
}

async function requestComparisonSoundtrack(
  selector: RepositoryMediaSelector,
): Promise<AlbumSoundtrack> {
  const response = await fetch("/api/repository-soundtrack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selector),
  });
  const result = (await response.json()) as { soundtrack?: AlbumSoundtrack; error?: string };
  if (!response.ok || !result.soundtrack) {
    throw new Error(result.error || "Could not build this album’s soundtrack.");
  }
  return result.soundtrack;
}

function CompareStat({
  label,
  first,
  second,
}: {
  label: string;
  first: number | string;
  second: number | string;
}) {
  return (
    <div className="insights-compare-stat">
      <span>{label}</span>
      <strong>{typeof first === "number" ? first.toLocaleString() : first}</strong>
      <span className="insights-compare-stat-divider">vs</span>
      <strong>{typeof second === "number" ? second.toLocaleString() : second}</strong>
    </div>
  );
}

function getLanguageShares(
  first: RepositoryComparison,
  second: RepositoryComparison,
): LanguageShare[] {
  const firstTotal = Object.values(first.languages).reduce(
    (total, bytes) => total + bytes,
    0,
  );
  const secondTotal = Object.values(second.languages).reduce(
    (total, bytes) => total + bytes,
    0,
  );
  const languageNames = new Set([
    ...Object.keys(first.languages),
    ...Object.keys(second.languages),
  ]);

  const allShares = [...languageNames]
    .map((name) => ({
      name,
      color: getLanguageColor(name),
      firstPercentage:
        firstTotal > 0
          ? Math.round(((first.languages[name] ?? 0) / firstTotal) * 100)
          : 0,
      secondPercentage:
        secondTotal > 0
          ? Math.round(((second.languages[name] ?? 0) / secondTotal) * 100)
          : 0,
    }))
    .sort(
      (a, b) =>
        Math.max(b.firstPercentage, b.secondPercentage) -
          Math.max(a.firstPercentage, a.secondPercentage) ||
        a.name.localeCompare(b.name),
    );
  if (allShares.length <= 8) return allShares;

  const primaryLanguages = allShares.slice(0, 7);
  const otherLanguages = allShares.slice(7);
  const firstOtherPercentage = otherLanguages.reduce(
    (total, language) => total + language.firstPercentage,
    0,
  );
  const secondOtherPercentage = otherLanguages.reduce(
    (total, language) => total + language.secondPercentage,
    0,
  );
  return [
    ...primaryLanguages,
    {
      name: "Other languages",
      color: "#887969",
      firstPercentage: firstOtherPercentage,
      secondPercentage: secondOtherPercentage,
    },
  ];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
