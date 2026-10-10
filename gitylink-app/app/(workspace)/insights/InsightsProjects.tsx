"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { GitHubRepository } from "@/lib/github-repositories";

type SortMode = "recent" | "stars";

export default function InsightsProjects({
  repositories,
}: {
  repositories: GitHubRepository[];
}) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const sortedRepositories = useMemo(
    () =>
      [...repositories].sort((first, second) =>
        sortMode === "stars"
          ? second.stars - first.stars ||
            Date.parse(second.updatedAt) - Date.parse(first.updatedAt)
          : Date.parse(second.updatedAt) - Date.parse(first.updatedAt) ||
            second.stars - first.stars,
      ),
    [repositories, sortMode],
  );

  return (
    <section className="insights-card insights-projects" aria-labelledby="projects-title">
      <div className="insights-card-heading">
        <div>
          <p className="record-eyebrow">PROJECT SPOTLIGHT</p>
          <h2 id="projects-title">Your projects at a glance</h2>
        </div>
        <div className="insights-sort" aria-label="Sort projects">
          <button
            type="button"
            className={sortMode === "recent" ? "active" : ""}
            aria-pressed={sortMode === "recent"}
            onClick={() => setSortMode("recent")}
          >
            Recently updated
          </button>
          <button
            type="button"
            className={sortMode === "stars" ? "active" : ""}
            aria-pressed={sortMode === "stars"}
            onClick={() => setSortMode("stars")}
          >
            Most starred
          </button>
        </div>
      </div>
      {sortedRepositories.length === 0 ? (
        <p className="insights-no-data">No repositories to rank yet.</p>
      ) : (
        <ol className="insights-project-list">
          {sortedRepositories.slice(0, 8).map((repository, index) => (
            <li className="insights-project" key={repository.id}>
              <span className="insights-project-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="insights-project-info">
                <a href={repository.url} target="_blank" rel="noreferrer">
                  {repository.name}
                  <span aria-hidden="true"> ↗</span>
                </a>
                <span className="insights-project-language">
                  {repository.language || "Language not specified"}
                </span>
                <p>
                  {repository.description || "No project description provided."}
                </p>
              </div>
              <span className="insights-project-stat" aria-label={`${repository.stars} stars`}>
                ★ {repository.stars.toLocaleString()}
              </span>
              <span className="insights-project-stat" aria-label={`${repository.forks} forks`}>
                ⑂ {repository.forks.toLocaleString()}
              </span>
              <time
                className="insights-project-updated"
                dateTime={repository.updatedAt}
                title={`Last updated ${new Date(repository.updatedAt).toLocaleDateString()}`}
              >
                {new Date(repository.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </li>
          ))}
        </ol>
      )}
      {repositories.length > 8 && (
        <p className="insights-projects-more">
          Showing 8 of {repositories.length} repositories.{" "}
          <Link href="/repositories">Browse all repositories →</Link>
        </p>
      )}
    </section>
  );
}
