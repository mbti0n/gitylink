"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BeatCat from "@/components/BeatCat";
import RepositoryAlbumArt from "@/components/RepositoryAlbumArt";
import type { GitHubRepository } from "@/lib/github-repositories";

export default function Repositories({
  repositories,
}: {
  repositories: GitHubRepository[] | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const filteredRepositories = useMemo(
    () =>
      (repositories ?? []).filter((repository) =>
        `${repository.name} ${repository.language ?? ""} ${repository.description ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [repositories, query],
  );

  return (
    <div className="record-page">
      <header className="record-page-heading">
        <div>
          <p className="record-eyebrow">Your record shelf</p>
          <h1>Repository albums</h1>
          <p>Every repo has a sound. Give yours a one-of-one cover.</p>
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
                  <a href={repository.url} target="_blank" rel="noreferrer">
                    {repository.name}
                  </a>
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
                </div>
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
