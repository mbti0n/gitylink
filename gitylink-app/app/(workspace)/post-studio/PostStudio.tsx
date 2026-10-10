"use client";

import { useState } from "react";
import type { GitHubProfile } from "@/lib/github-profile";

type Commit = {
  sha: string;
  message: string;
};

type Story = {
  repo: string;
  repoDescription: string;
  title: string;
  time: string;
  commits: Commit[];
  commitCount: number;
  span: string;
  draft: string;
};

const stories: Story[] = [
  {
    repo: "task-manager-api",
    repoDescription: "A task management API with JWT authentication.",
    title: "Finally fixed JWT authentication",
    time: "Yesterday",
    commitCount: 6,
    span: "4 days of work · main branch",
    commits: [
      { sha: "7c2e9a4", message: "Fix JWT refresh flow" },
      { sha: "5d8a1c0", message: "Validate protected routes" },
      { sha: "c41e6b8", message: "Handle expired tokens" },
    ],
    draft: [
      "After 4 days of debugging, JWT authentication finally works end to end in my task-manager API.",
      "The tricky part? Keeping token refresh and protected routes in sync.",
      "I traced the middleware, fixed validation, and made expired tokens fail cleanly.",
      "My takeaway: debug the whole request lifecycle, not just the failing endpoint.",
      "Small milestone, real progress. Next up: edge-case tests.",
      "Built with Node.js and PostgreSQL.",
      "#BuildInPublic #NodeJS #WebDevelopment",
    ].join("\n\n"),
  },
  {
    repo: "portfolio-website",
    repoDescription: "My personal portfolio, built with React and TypeScript.",
    title: "Shipped my new personal portfolio",
    time: "2 hours ago",
    commitCount: 8,
    span: "2 weeks of work · main branch",
    commits: [
      { sha: "a91f3d2", message: "Deploy production build" },
      { sha: "3be07c5", message: "Refine page transitions" },
      { sha: "e2d4a18", message: "Make project grid responsive" },
    ],
    draft: [
      "My new portfolio is live.",
      "I rebuilt it from scratch with responsive pages, smoother animations, and a cleaner project grid.",
      "My takeaway: shipping a simple version beats polishing forever.",
      "Built with React and TypeScript.",
      "#BuildInPublic #React #TypeScript",
    ].join("\n\n"),
  },
  {
    repo: "docker-homelab",
    repoDescription: "Containerized development environment for my homelab.",
    title: "Automated my development environment",
    time: "3 days ago",
    commitCount: 5,
    span: "3 days of work · main branch",
    commits: [
      { sha: "f07b6c1", message: "Add compose file for dev services" },
      { sha: "9c3e2a7", message: "Script environment bootstrap" },
      { sha: "41d8b0e", message: "Document local setup" },
    ],
    draft: [
      "Setting up my dev environment used to take an afternoon. Now it takes one command.",
      "I moved my services into Docker containers and scripted the bootstrap.",
      "My takeaway: automate the boring setup once, and every project after that starts faster.",
      "#BuildInPublic #Docker #DevOps",
    ].join("\n\n"),
  },
];

const toneOptions = ["Authentic & reflective", "Professional", "Casual", "Enthusiastic"];
const lengthOptions = ["Short", "Medium", "Long"];
function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function PostStudio({
  profile,
}: {
  profile: GitHubProfile | null;
}) {
  const [repoFilter, setRepoFilter] = useState("all");
  const [selectedRepo, setSelectedRepo] = useState(stories[0].repo);
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(stories.map((story) => [story.repo, story.draft])),
  );
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState(toneOptions[0]);
  const [length, setLength] = useState("Medium");
  const story = stories.find((s) => s.repo === selectedRepo) ?? stories[0];
  const draft = drafts[story.repo];
  const visibleStories =
    repoFilter === "all" ? stories : stories.filter((s) => s.repo === repoFilter);
  const authorName = profile?.name || profile?.login || "GitHub account";
  const authorDetails = profile
    ? `@${profile.login}${profile.bio ? ` · ${profile.bio}` : ""}`
    : "GitHub profile unavailable";

  function updateDraft(text: string) {
    setDrafts((current) => ({ ...current, [story.repo]: text }));
    setSaved(false);
  }

  async function copyPost() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div className="page-intro">
          <h1>Turn your commits into a story</h1>
          <p>Start with real work. Make it sound like you.</p>
        </div>
        <span className="save-status" aria-live="polite">
          {saved ? "✓  Draft saved just now" : "Unsaved changes"}
        </span>
        <button type="button" className="btn btn-secondary" onClick={() => setSaved(true)}>
          Save draft
        </button>
        <button type="button" className="btn btn-primary" onClick={copyPost}>
          {copied ? "Copied ✓" : "Copy post ↗"}
        </button>
      </div>

      <div className="studio-grid">
        <div className="page-column">
          <h2>Choose your story</h2>

          <div className="panel story-panel">
            <div className="panel-label">FROM YOUR REPOSITORIES</div>
            <label className="field">
              <span aria-hidden="true">▤</span>
              <select
                aria-label="Repository"
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
              >
                <option value="all">All repositories</option>
                {stories.map((s) => (
                  <option key={s.repo} value={s.repo}>
                    {s.repo}
                  </option>
                ))}
              </select>
            </label>

            {visibleStories.map((s) => {
              const selected = s.repo === story.repo;
              return (
                <button
                  key={s.repo}
                  type="button"
                  className={selected ? "story-option selected" : "story-option"}
                  aria-pressed={selected}
                  onClick={() => setSelectedRepo(s.repo)}
                >
                  <span className="story-repo">
                    {selected ? "✓" : "⌁"}  {s.repo}
                  </span>
                  <span className="story-title">{s.title}</span>
                  <span className="story-meta">
                    {s.time} · {s.commitCount} commits
                  </span>
                </button>
              );
            })}
          </div>

          <div className="panel evidence-panel">
            <div className="evidence-heading">
              <span>Source evidence</span>
              <span aria-hidden="true">⌁</span>
            </div>
            <span className="status-badge">{story.commitCount} commits linked</span>
            <p className="evidence-note">{story.span}</p>
            <hr className="divider" />
            <ul className="commit-list">
              {story.commits.map((commit) => (
                <li key={commit.sha}>
                  <div className="commit-message">{commit.message}</div>
                  <div className="commit-meta">
                    {commit.sha} · {story.repo}
                  </div>
                </li>
              ))}
            </ul>
            <a href="#" className="text-link">
              View all commits ↗
            </a>
          </div>
        </div>

        <div className="page-column">
          <h2>Your draft</h2>

          <div className="panel draft-panel">
            <div className="draft-toolbar">
              <span>{story.title}</span>
              <span className="draft-state">Draft</span>
            </div>
            <hr className="divider" />
            <div className="editor">
              <textarea
                aria-label="Post draft"
                value={draft}
                onChange={(e) => updateDraft(e.target.value)}
              />
              <div className="editor-status">
                <span>Edit your story here</span>
                <span>
                  {countWords(draft)} words · {draft.length} characters
                </span>
              </div>
            </div>
            <div className="button-row">
              <button type="button" className="btn btn-secondary">
                ✦  Refine tone
              </button>
              <button type="button" className="btn btn-secondary">
                Shorten
              </button>
              <button type="button" className="btn btn-secondary">
                Try a new hook
              </button>
            </div>
          </div>

          <div className="panel settings-panel">
            <div className="panel-title">Generation settings</div>
            <div className="settings-row">
              <label className="setting">
                <span className="setting-label">Tone</span>
                <span className="field">
                  <select value={tone} onChange={(e) => setTone(e.target.value)}>
                    {toneOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="setting narrow">
                <span className="setting-label">Length</span>
                <span className="field">
                  <select value={length} onChange={(e) => setLength(e.target.value)}>
                    {lengthOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
            <div className="generate-row">
              <span>Use linked commit evidence</span>
              <button type="button" className="btn btn-primary">
                ✦  Regenerate draft
              </button>
            </div>
          </div>
        </div>

        <div className="page-column preview-column">
          <h2>Post preview</h2>

          <div className="panel preview-panel">
            <div className="author">
              <div className="author-avatar">{initials(authorName)}</div>
              <div className="author-details">
                <span className="author-name">{authorName}</span>
                <span>{authorDetails}</span>
                <span>Just now · 🌐</span>
              </div>
              <span className="author-more" aria-hidden="true">
                •••
              </span>
            </div>
            <p className="preview-body">{draft}</p>
            <div className="attachment">
              <span className="attachment-repo">⌁  {story.repo}</span>
              <span className="attachment-description">{story.repoDescription}</span>
              <span className="attachment-meta">github.com · Public repository</span>
            </div>
            <hr className="divider" />
            <div className="social-actions" aria-hidden="true">
              <span>♧ Like</span>
              <span>○ Comment</span>
              <span>↻ Repost</span>
              <span>↗ Send</span>
            </div>
          </div>

          <div className="panel review-panel">
            <strong>✓  Ready for your final review</strong>
            <p>
              Check the details, add your voice, then copy your post to share on LinkedIn.
            </p>
          </div>
        </div>
      </div>

      <p className="studio-footnote">
        AI drafts are grounded in your repository evidence. Review before sharing; nothing is
        published automatically.
      </p>
    </div>
  );
}
