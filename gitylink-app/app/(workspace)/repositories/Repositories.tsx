"use client";

import { useState } from "react";

const repositories = [
  {
    name: "campus-planner",
    languages: "React · TypeScript",
    commits: 42,
    opportunities: "3 post ideas",
  },
  {
    name: "homelab-dashboard",
    languages: "Docker · Python",
    commits: 36,
    opportunities: "2 post ideas",
  },
  {
    name: "data-story",
    languages: "Python · Pandas",
    commits: 28,
    opportunities: "4 skills",
  },
];

export default function Repositories() {
  const [query, setQuery] = useState("");
  const [lastSynced, setLastSynced] = useState("2 minutes ago");
  const filteredRepositories = repositories.filter((repository) =>
    `${repository.name} ${repository.languages}`
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
          onClick={() => setLastSynced("just now")}
        >
          ↻ Sync now
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
          ✓ Synced {lastSynced}
        </span>
      </div>

      <div className="repository-list" aria-live="polite">
        {filteredRepositories.map((repository) => (
          <article className="repository-card" key={repository.name}>
            <div className="repository-card-heading">
              <h2>{repository.name}</h2>
              <span className="repository-status">Connected</span>
            </div>
            <p className="repository-summary">
              {repository.languages} <span aria-hidden="true">·</span>{" "}
              {repository.commits} commits <span aria-hidden="true">·</span>{" "}
              {repository.opportunities}
            </p>
            <div className="repository-actions">
              <a
                className="btn btn-secondary"
                href={`https://github.com/search?q=${encodeURIComponent(repository.name)}&type=repositories`}
                target="_blank"
                rel="noreferrer"
              >
                View project
              </a>
              <a
                className="btn btn-secondary"
                href="https://github.com/settings/installations"
                target="_blank"
                rel="noreferrer"
              >
                Manage access
              </a>
            </div>
          </article>
        ))}
        {filteredRepositories.length === 0 && (
          <p className="repository-empty">No repositories match “{query}”.</p>
        )}
      </div>
    </div>
  );
}