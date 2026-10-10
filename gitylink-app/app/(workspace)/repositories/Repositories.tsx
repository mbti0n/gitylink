"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GitHubRepository } from "@/lib/github-repositories";

export default function Repositories({
  repositories,
}: {
  repositories: GitHubRepository[] | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const filteredRepositories = (repositories ?? []).filter((repository) =>
    `${repository.name} ${repository.language ?? ""} ${repository.description ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <div className="page-content repositories-content">
      <div className="page-heading">
        <div className="page-intro">
          <h1>Your repositories</h1>
          <p>Manage the projects that power your posts and skill evidence.</p>
        </div>
      </div>

      <div className="repository-toolbar">
        <a
          className="btn btn-primary"
          href="https://github.com/settings/installations"
          target="_blank"
          rel="noreferrer"
        >
          + Add repositories
        </a>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
        >
          ↻ {isRefreshing ? "Syncing…" : "Sync now"}
        </button>
        <label className="field repository-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search repositories"
            placeholder="Search repositories..."
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span className="repository-sync" aria-live="polite">
          {repositories === null
            ? "GitHub unavailable"
            : `${repositories.length} public repositories`}
        </span>
      </div>

      <div className="repository-list" aria-live="polite">
        {filteredRepositories.map((repository) => (
          <article className="repository-card" key={repository.id}>
            <div className="repository-card-heading">
              <h2>
                <a href={repository.url} target="_blank" rel="noreferrer">
                  {repository.name}
                </a>
              </h2>
              <span className="repository-status">Public</span>
            </div>
            <p className="repository-summary">
              {repository.description || "No description provided."}
            </p>
            <p className="repository-meta">
              {repository.language || "No primary language"} <span aria-hidden="true">·</span>{" "}
              Updated {new Date(repository.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })} <span aria-hidden="true">·</span> {repository.stars} stars
            </p>
          </article>
        ))}
        {repositories === null ? (
          <p className="repository-empty">
            Couldn’t load repositories. Check that <code>GITHUB_TOKEN</code> is valid and can access your account.
          </p>
        ) : filteredRepositories.length === 0 ? (
          <p className="repository-empty">
            {query ? `No repositories match “${query}”.` : "No public repositories found for this account."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
