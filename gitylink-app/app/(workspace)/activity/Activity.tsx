"use client";

import Link from "next/link";
import { useState } from "react";
import GitHubContributionGraph from "@/components/GitHubContributionGraph";
import type { ContributionCalendar } from "@/lib/github-contributions";

type Commit = {
  sha: string;
  repo: string;
  time: string;
  daysAgo: number;
  message: string;
  meta: string;
  moment?: string;
};

const TOTAL_COMMITS = 148;

const metrics = [
  { value: "148", label: "Commits this month", note: "↑ 23% from last month", accent: true },
  { value: "12", label: "Repositories tracked", note: "3 active this week" },
  { value: "18", label: "Active days", note: "6-day current streak" },
  { value: "8", label: "Post opportunities", note: "3 new moments this week" },
];

const commits: Commit[] = [
  {
    sha: "a3f8c21",
    repo: "portfolio-website",
    time: "2 hours ago",
    daysAgo: 0,
    message: "feat: ship responsive portfolio and deploy to production",
    meta: "a3f8c21 · main · 8 files changed · +246 −38 · React, TypeScript",
    moment: "Shipped my new personal portfolio",
  },
  {
    sha: "f91b7d0",
    repo: "portfolio-website",
    time: "4 hours ago",
    daysAgo: 0,
    message: "style: refine page transitions and mobile navigation",
    meta: "f91b7d0 · main · 4 files changed · +82 −24 · React",
  },
  {
    sha: "7c2e9a4",
    repo: "task-manager-api",
    time: "Yesterday",
    daysAgo: 1,
    message: "fix: resolve JWT refresh and authorization flow",
    meta: "7c2e9a4 · main · 6 files changed · +184 −62 · Node.js, Security",
    moment: "Finally fixed JWT authentication",
  },
  {
    sha: "b6d03f2",
    repo: "docker-homelab",
    time: "3 days ago",
    daysAgo: 3,
    message: "feat: add Docker Compose services and environment config",
    meta: "b6d03f2 · main · 5 files changed · +126 −19 · Docker, DevOps",
    moment: "Automated my development environment",
  },
];

const repos = Array.from(new Set(commits.map((c) => c.repo)));
const periods = [
  { id: "today", label: "Today", maxDays: 0 },
  { id: "week", label: "This week", maxDays: 7 },
  { id: "month", label: "This month", maxDays: 31 },
];

export default function Activity({
  contributionCalendar,
}: {
  contributionCalendar: ContributionCalendar | null;
}) {
  const [repo, setRepo] = useState("all");
  const [period, setPeriod] = useState("month");
  const [query, setQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState("all");
  const [syncLabel, setSyncLabel] = useState("Synced 2 minutes ago");

  const maxDays = periods.find((p) => p.id === period)?.maxDays ?? 31;
  const search = query.trim().toLowerCase();
  const visibleCommits = commits.filter(
    (c) =>
      (repo === "all" || c.repo === repo) &&
      c.daysAgo <= maxDays &&
      (feedFilter === "all" || c.moment) &&
      (!search || c.message.toLowerCase().includes(search) || c.repo.includes(search)),
  );

  function syncNow() {
    setSyncLabel("Syncing…");
    setTimeout(() => setSyncLabel("Synced just now"), 800);
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div className="page-intro">
          <h1>Your development activity</h1>
          <p>Every commit is progress. Find the moments worth sharing.</p>
        </div>
        <Link href="/post-studio" className="btn btn-primary">
          +  Create a post
        </Link>
      </div>

      <div className="activity-filters">
        <label className="field repo-filter">
          <span aria-hidden="true">▤</span>
          <select aria-label="Repository" value={repo} onChange={(e) => setRepo(e.target.value)}>
            <option value="all">All repositories</option>
            {repos.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="field period-filter">
          <span aria-hidden="true">◷</span>
          <select aria-label="Time period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Search commits"
            placeholder="Search commits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span className="save-status sync-status" aria-live="polite">
          ✓  {syncLabel}
        </span>
        <button type="button" className="btn btn-secondary" onClick={syncNow}>
          ↻  Sync now
        </button>
      </div>

      <div className="kpi-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="panel kpi-panel">
            <div className="kpi-row">
              <span className={metric.accent ? "kpi-value accent" : "kpi-value"}>
                {metric.value}
              </span>
              <span className="kpi-label">{metric.label}</span>
            </div>
            <span className="kpi-note">{metric.note}</span>
          </div>
        ))}
      </div>

        <div className="panel contrib-panel">
          <div className="panel-heading">
            <span className="panel-title">Contribution overview</span>
            <span className="panel-meta">
              {contributionCalendar
                ? `${contributionCalendar.totalContributions.toLocaleString()} contributions in the past year`
                : "GitHub activity unavailable"}
            </span>
          </div>
          <GitHubContributionGraph calendar={contributionCalendar} />
        </div>

      <div className="activity-grid">
        <div className="page-column">
          <div className="column-heading">
            <h2>Recent activity</h2>
            <label className="inline-select">
              <select
                aria-label="Activity type"
                value={feedFilter}
                onChange={(e) => setFeedFilter(e.target.value)}
              >
                <option value="all">All activity</option>
                <option value="moments">Worth sharing</option>
              </select>
            </label>
          </div>

          <div className="panel feed-panel">
            {visibleCommits.length > 0 ? (
              <ul className="feed-list">
                {visibleCommits.map((commit) => (
                  <li key={commit.sha} className="feed-item">
                    <div className="feed-entry">
                      <div className="commit-marker" aria-hidden="true">
                        ⌁
                      </div>
                      <div className="feed-details">
                        <div className="feed-topline">
                          <span className="feed-repo">{commit.repo}</span>
                          <span className="feed-time">{commit.time}</span>
                        </div>
                        <div className="feed-message">{commit.message}</div>
                        <div className="feed-meta">{commit.meta}</div>
                        {commit.moment && (
                          <div className="feed-moment">
                            <span>✦  {commit.moment}</span>
                            <Link href="/post-studio" className="feed-link">
                              Draft post →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="feed-empty">No commits match these filters.</p>
            )}
            <div className="feed-footer">
              <span>
                Showing {visibleCommits.length} of {TOTAL_COMMITS} commits
              </span>
              <button type="button" className="link-btn">
                Load more activity ↓
              </button>
            </div>
          </div>
        </div>

        <div className="page-column">
          <h2>Worth sharing</h2>

          <div className="panel highlight-panel">
            <div className="panel-title">✦  This week&apos;s highlight</div>
            <span className="status-badge">Suggested story</span>
            <p className="highlight-story">
              You turned 4 days of debugging into a working auth flow.
            </p>
            <p className="highlight-note">
              JWT authentication now works end to end in task-manager-api. Share what finally
              clicked.
            </p>
            <Link href="/post-studio" className="btn btn-primary">
              Generate story →
            </Link>
          </div>

          <div className="panel evidence-card">
            <div className="panel-title">Your work, backed by evidence</div>
            <p className="highlight-note">
              Stories are linked to real commits, files and repositories—not just a summary.
            </p>
            <Link href="/skills" className="text-link">
              Explore demonstrated skills →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
