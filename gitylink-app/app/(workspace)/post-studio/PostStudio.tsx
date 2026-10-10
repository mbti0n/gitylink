"use client";

import { useRef, useState } from "react";
import type { GitHubCommit } from "@/lib/github-activity";
import type { GitHubProfile } from "@/lib/github-profile";
import type { GitHubRepository } from "@/lib/github-repositories";

type RewriteAction = "generate" | "rewrite" | "shorten" | "new_hook";

const toneOptions = [
  { value: "authentic_reflective", label: "Authentic & reflective" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

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
  repositories,
}: {
  profile: GitHubProfile | null;
  repositories: GitHubRepository[] | null;
}) {
  const [selectedRepoName, setSelectedRepoName] = useState("");
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState(toneOptions[0].value);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [repositoryError, setRepositoryError] = useState("");
  const [actionError, setActionError] = useState("");
  const draftSectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);

  const selectedRepo = repositories?.find((repository) => repository.name === selectedRepoName);
  const draft = selectedRepoName ? drafts[selectedRepoName] ?? "" : "";
  const authorName = profile?.name || profile?.login || "GitHub account";
  const authorDetails = profile
    ? `@${profile.login}${profile.bio ? ` · ${profile.bio}` : ""}`
    : "GitHub profile unavailable";

  async function selectRepository(repositoryName: string) {
    setSelectedRepoName(repositoryName);
    setCommits([]);
    setShowPreview(false);
    setRepositoryError("");
    setActionError("");
    if (!repositoryName) return;

    setIsLoadingCommits(true);
    try {
      const response = await fetch(
        `/api/repository-commits?repo=${encodeURIComponent(repositoryName)}`,
      );
      const result = (await response.json()) as {
        commits?: GitHubCommit[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Could not load repository commits.");
      setCommits(result.commits ?? []);
      if (result.commits?.length) {
        window.setTimeout(
          () => draftSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          0,
        );
      }
    } catch (requestError) {
      setRepositoryError(
        requestError instanceof Error ? requestError.message : "Could not load repository commits.",
      );
    } finally {
      setIsLoadingCommits(false);
    }
  }

  function updateDraft(text: string) {
    if (!selectedRepoName) return;
    setDrafts((current) => ({ ...current, [selectedRepoName]: text }));
    setSaved(false);
  }

  async function runAiAction(action: RewriteAction) {
    if (!selectedRepo || commits.length === 0) return;

    setIsGenerating(true);
    setActionError("");
    try {
      const response = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: selectedRepo.name,
          commits: commits.slice(0, 30).map((commit) => commit.message),
          readme: selectedRepo.description ?? "",
          tone,
          action,
          draft: action === "generate" ? undefined : draft,
        }),
      });
      const result = (await response.json()) as { draft?: string; error?: string };
      if (!response.ok || !result.draft) {
        throw new Error(result.error || "Could not generate a draft.");
      }
      updateDraft(result.draft);
      setShowPreview(false);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : "Could not generate a draft.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function proceedToPreview() {
    setShowPreview(true);
    window.setTimeout(
      () => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div className="page-intro">
          <h1>Turn your commits into a story</h1>
          <p>Start with real work. Make it sound like you.</p>
        </div>
      </div>

      <section className="story-selection-section" aria-labelledby="choose-story-heading">
        <div className="story-selection-header">
          <h2 id="choose-story-heading">Choose your story</h2>
          <label className="field story-repository-select">
            <span className="sr-only">Repository</span>
            <select
              aria-label="Repository"
              value={selectedRepoName}
              onChange={(event) => void selectRepository(event.target.value)}
              disabled={!repositories?.length || isLoadingCommits}
            >
              <option value="">
                {repositories === null ? "GitHub unavailable" : "Choose a repository"}
              </option>
              {repositories?.map((repository) => (
                <option key={repository.id} value={repository.name}>
                  {repository.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoadingCommits && <p className="story-feedback">Loading commits…</p>}
        {!isLoadingCommits && selectedRepoName && commits.length === 0 && !repositoryError && (
          <p className="story-feedback">No commits found for this repository.</p>
        )}
        {commits.length > 0 && (
          <div className="panel selected-commits-panel">
            <div className="selected-commits-heading">
              <span>Recent commits from {selectedRepoName}</span>
              <span>{commits.length} loaded</span>
            </div>
            <ul className="selected-commits-list">
              {commits.map((commit) => (
                <li key={commit.sha}>
                  <a href={commit.url} target="_blank" rel="noreferrer">
                    {commit.message}
                  </a>
                  <span>{commit.sha.slice(0, 7)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!repositories?.length && repositories !== null && (
          <p className="story-feedback">No public repositories are available to choose.</p>
        )}
        {repositoryError && <p className="studio-error" role="alert">{repositoryError}</p>}
      </section>

      {selectedRepo && commits.length > 0 && (
        <>
          <section className="draft-workflow-section" ref={draftSectionRef} aria-labelledby="your-draft-heading">
            <h2 id="your-draft-heading">Your draft</h2>
            <div className="draft-workflow-grid">
              <div className="panel draft-panel draft-editor-panel">
                <div className="draft-toolbar">
                  <span>{selectedRepo.name}</span>
                  <span className="draft-state">Draft</span>
                </div>
                <label className="editor">
                  <span className="sr-only">Project draft</span>
                  <textarea
                    aria-label="Project draft"
                    value={draft}
                    onChange={(event) => updateDraft(event.target.value)}
                    placeholder="Generate a draft with the AI writing tools, or start writing here."
                  />
                  <span className="editor-status">
                    <span>Edit your story here</span>
                    <span>{countWords(draft)} words · {draft.length} characters</span>
                  </span>
                </label>

                <a className="attachment repo-embed-link" href={selectedRepo.url} target="_blank" rel="noreferrer">
                  <span className="attachment-repo">⌁  {selectedRepo.name} ↗</span>
                  <span className="attachment-description">
                    {selectedRepo.description || "View this repository and its source on GitHub."}
                  </span>
                  <span className="attachment-meta">github.com · Public repository</span>
                </a>
              </div>

              <aside className="panel ai-actions-panel" aria-label="AI writing actions">
                <div className="panel-title">AI writing tools</div>
                <label className="setting">
                  <span className="setting-label">Voice</span>
                  <span className="field">
                    <select value={tone} onChange={(event) => setTone(event.target.value)}>
                      {toneOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void runAiAction(draft ? "rewrite" : "generate")}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Working…" : draft ? "Rewrite in this voice" : "Generate draft"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void runAiAction("shorten")}
                  disabled={!draft || isGenerating}
                >
                  Shorten draft
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void runAiAction("new_hook")}
                  disabled={!draft || isGenerating}
                >
                  Try a new hook
                </button>
                {actionError && <p className="studio-error" role="alert">{actionError}</p>}
                <button
                  type="button"
                  className="btn btn-primary proceed-button"
                  onClick={proceedToPreview}
                  disabled={!draft || isGenerating}
                >
                  Continue to preview →
                </button>
              </aside>
            </div>
          </section>

          {showPreview && (
            <section className="post-preview-section" ref={previewRef} aria-labelledby="preview-heading">
              <h2 id="preview-heading">Draft preview</h2>
              <div className="panel preview-panel">
                <div className="author">
                  <div className="author-avatar">{initials(authorName)}</div>
                  <div className="author-details">
                    <span className="author-name">{authorName}</span>
                    <span>{authorDetails}</span>
                    <span>Project update · Draft preview</span>
                  </div>
                </div>
                <p className="preview-body">{draft}</p>
                <a className="attachment repo-embed-link" href={selectedRepo.url} target="_blank" rel="noreferrer">
                  <span className="attachment-repo">⌁  {selectedRepo.name} ↗</span>
                  <span className="attachment-description">
                    {selectedRepo.description || "View this repository and its source on GitHub."}
                  </span>
                  <span className="attachment-meta">github.com · Public repository</span>
                </a>
              </div>
              <div className="panel review-panel">
                <strong>✓  Ready for your final review</strong>
                <p>Check the details, add your voice, then copy your project update.</p>
              </div>
              <div className="post-preview-actions">
                <span className="save-status" aria-live="polite">
                  {saved ? "✓  Draft saved just now" : "Unsaved changes"}
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => setSaved(true)}>
                  Save draft
                </button>
                <button type="button" className="btn btn-primary" onClick={copyDraft} disabled={!draft}>
                  {copied ? "Copied ✓" : "Copy draft"}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      <p className="studio-footnote">
        AI drafts are grounded in your repository commits. Review before sharing; nothing is
        published automatically.
      </p>
    </div>
  );
}
