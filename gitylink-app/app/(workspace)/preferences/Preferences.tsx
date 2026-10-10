"use client";

import { useState } from "react";
import type { GitHubProfile } from "@/lib/github-profile";

const flowSteps = [
  { icon: "⌁", title: "GitHub", detail: "Reads your commits" },
  { icon: "✦", title: "Gitylink", detail: "Drafts your story" },
  { icon: "in", title: "LinkedIn", detail: "Posts when you approve" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function Preferences({
  github,
}: {
  github: GitHubProfile | null;
}) {
  const [linkedInConnected, setLinkedInConnected] = useState(true);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const githubName = github?.name || github?.login || "GitHub account";

  function cancelRemove() {
    setConfirmingRemove(false);
    setConfirmText("");
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div className="page-intro">
          <p className="eyebrow">Settings</p>
          <h1>Preferences</h1>
          <p>There&apos;s no separate account or password. You sign in with GitHub and post to LinkedIn.</p>
        </div>
      </div>

      <ol className="panel pref-flow" aria-label="How Gitylink works">
        {flowSteps.map((step) => (
          <li key={step.title} className="pref-flow-step">
            <span className="pref-flow-icon" aria-hidden="true">
              {step.icon}
            </span>
            <span className="pref-flow-text">
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <section className="pref-section" aria-labelledby="connections-heading">
        <div className="pref-section-intro">
          <h2 id="connections-heading">Connected accounts</h2>
          <p>Your name and photo come from GitHub. Update them there and they&apos;ll sync here.</p>
        </div>

        <div className="panel pref-panel">
          <div className="pref-connection">
            <div className="pref-avatar" aria-hidden="true">
              {initials(githubName)}
            </div>
            <div className="pref-connection-text">
              <strong>
                GitHub <span className="pref-role">Source</span>
              </strong>
              <span>
                {github
                  ? `Signed in as ${githubName} · @${github.login}`
                  : "GitHub profile unavailable"}
              </span>
              <span>Reads commits from the repositories you choose.</span>
            </div>
            <div className="pref-connection-actions">
              <span className="status-badge">Connected</span>
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Manage on GitHub ↗
              </a>
            </div>
          </div>

          <div className="pref-connection">
            <div className="pref-connection-icon linkedin" aria-hidden="true">
              in
            </div>
            <div className="pref-connection-text">
              <strong>
                LinkedIn <span className="pref-role">Destination</span>
              </strong>
              {linkedInConnected ? (
                <>
                  <span>Posting as {githubName}</span>
                  <span>Nothing is published until you approve a post.</span>
                </>
              ) : (
                <span>Connect LinkedIn to publish your stories directly.</span>
              )}
            </div>
            <div className="pref-connection-actions">
              {linkedInConnected ? (
                <>
                  <span className="status-badge">Connected</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setLinkedInConnected(false)}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setLinkedInConnected(true)}
                >
                  Connect LinkedIn
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pref-section" aria-labelledby="account-heading">
        <div className="pref-section-intro">
          <h2 id="account-heading">Session &amp; data</h2>
          <p>Sign out of this device, or remove Gitylink completely.</p>
        </div>

        <div className="panel pref-panel">
          <div className="pref-row">
            <div className="pref-row-text">
              <strong>Log out</strong>
              <p>Sign out on this device. Your GitHub and LinkedIn connections stay in place.</p>
            </div>
            <button type="button" className="btn btn-secondary">
              Log out
            </button>
          </div>

          <hr className="divider" />

          <div className="pref-row danger">
            <div className="pref-row-text">
                <strong>Remove Gitylink</strong>
              <p>
                Revoke GitHub and LinkedIn access and delete your drafts. Posts already on LinkedIn
                stay there.
              </p>
            </div>
            {!confirmingRemove && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirmingRemove(true)}
              >
                Remove access
              </button>
            )}
          </div>

          {confirmingRemove && (
            <div className="pref-confirm">
              <label className="setting">
                <span className="setting-label">
                  Type <strong>REMOVE</strong> to confirm
                </span>
                <input
                  className="input"
                  value={confirmText}
                  autoComplete="off"
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </label>
              <div className="pref-confirm-actions">
                <button type="button" className="btn btn-secondary" onClick={cancelRemove}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger solid"
                  disabled={confirmText !== "REMOVE"}
                >
                  Remove everything
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
