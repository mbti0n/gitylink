import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getGitHubRepositories } from "@/lib/github-repositories";
import SpotifySuggestions from "./SpotifySuggestions";

export const metadata: Metadata = {
  title: "Skills Explorer",
};

type Track = {
  language: string;
  repositories: { name: string; url: string }[];
  color: string;
};

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#e2bd44",
  Python: "#5788b8",
  Rust: "#c77650",
  Go: "#54a9bd",
  Java: "#d77855",
  "C++": "#7593d5",
  Ruby: "#c95e65",
  Swift: "#e98758",
  HTML: "#df7654",
  CSS: "#6e83d2",
};

export default function SkillsExplorerPage() {
  return (
    <section className="content-panel">
      <Suspense fallback={<SongsLoading />}>
        <SongsFromGitHub />
      </Suspense>
    </section>
  );
}

async function SongsFromGitHub() {
  const repositories = await getGitHubRepositories();
  const tracks: Track[] = [];

  if (repositories) {
    const byLanguage = new Map<string, Track>();
    for (const repository of repositories) {
      if (!repository.language) continue;
      const existing = byLanguage.get(repository.language);
      if (existing) {
        existing.repositories.push({ name: repository.name, url: repository.url });
      } else {
        byLanguage.set(repository.language, {
          language: repository.language,
          repositories: [{ name: repository.name, url: repository.url }],
          color: languageColors[repository.language] ?? "#c48757",
        });
      }
    }
    tracks.push(...byLanguage.values());
    tracks.sort(
      (first, second) =>
        second.repositories.length - first.repositories.length ||
        first.language.localeCompare(second.language),
    );
  }

  const totalProjects = tracks.reduce(
    (total, track) => total + track.repositories.length,
    0,
  );

  return (
    <div className="record-page songs-page">
      <header className="record-page-heading">
        <div>
          <p className="record-eyebrow">The skills explorer</p>
          <h1>Your work has a soundtrack.</h1>
          <p>
            Each primary language in your repositories becomes a track. More
            projects in that language means more plays.
          </p>
        </div>
        <div className="setlist-stamp" aria-hidden="true">
          <span>YOUR</span>
          <strong>SETLIST</strong>
          <span>VOL. 01</span>
        </div>
      </header>

      <div className="setlist-summary">
        <div><strong>{tracks.length}</strong><span>tracks</span></div>
        <span className="setlist-summary-divider" aria-hidden="true" />
        <div><strong>{totalProjects}</strong><span>projects in rotation</span></div>
        <span className="setlist-summary-note">
          Built from repository language data
        </span>
      </div>

      {repositories === null ? (
        <div className="record-empty">
          <span className="empty-record" aria-hidden="true">♫</span>
          <h2>Connect GitHub to hear your setlist</h2>
          <p>Your repository languages will become tracks in your skills collection.</p>
          <Link href="/" className="record-button record-button-primary">
            Connect on overview <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : tracks.length === 0 ? (
        <div className="record-empty">
          <span className="empty-record" aria-hidden="true">♫</span>
          <h2>No tracks in this setlist yet</h2>
          <p>Add primary languages to your repositories and they’ll show up here.</p>
          <Link href="/repositories" className="record-button record-button-primary">
            Browse repositories <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="setlist-layout">
            <section className="setlist-panel" aria-labelledby="setlist-title">
              <div className="setlist-heading">
                <div>
                  <span className="setlist-play-mark" aria-hidden="true">▶</span>
                  <div>
                    <p className="record-eyebrow">SIDE A · THE LANGUAGES</p>
                    <h2 id="setlist-title">Your setlist</h2>
                  </div>
                </div>
                <span>{tracks.length} tracks</span>
              </div>

              <ol className="track-list">
                {tracks.map((track, index) => {
                  const featuredRepository = track.repositories[0];
                  return (
                    <li key={track.language} className="track-row">
                      <span className="track-number">{String(index + 1).padStart(2, "0")}</span>
                      <span
                        className="track-art"
                        style={{ backgroundColor: track.color }}
                        aria-hidden="true"
                      >
                        <span>♫</span>
                      </span>
                      <div className="track-main">
                        <strong>{track.language}</strong>
                        <span>
                          {track.repositories.map((repository) => repository.name).join(" · ")}
                        </span>
                      </div>
                      <span className="track-plays">
                        {track.repositories.length}{" "}
                        {track.repositories.length === 1 ? "project" : "projects"}
                      </span>
                      <a
                        className="track-open"
                        href={featuredRepository.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${featuredRepository.name} on GitHub`}
                      >
                        ↗
                      </a>
                    </li>
                  );
                })}
              </ol>
            </section>

            <aside className="setlist-aside">
              <div className="setlist-aside-art" aria-hidden="true">
                <span className="setlist-aside-disc">♫</span>
                <span className="setlist-aside-caption">A COLLECTION<br />IN PROGRESS</span>
              </div>
              <p className="record-eyebrow">LINER NOTES</p>
              <h2>Skills, with receipts.</h2>
              <p>
                No guesswork or self-ratings here. Every track links back to the
                repositories where that language shows up.
              </p>
              <Link href="/repositories" className="record-text-link">
                Flip through the albums <span aria-hidden="true">→</span>
              </Link>
            </aside>
          </div>
          <SpotifySuggestions />
        </>
      )}
    </div>
  );
}

function SongsLoading() {
  return (
    <div className="record-page record-overview-loading" aria-label="Loading your setlist">
      <span className="record-loading-disc" aria-hidden="true">♫</span>
      <p>Counting in…</p>
    </div>
  );
}
