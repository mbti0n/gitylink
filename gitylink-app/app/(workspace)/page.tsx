import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BeatCat from "@/components/BeatCat";
import GitHubContributionGraph from "@/components/GitHubContributionGraph";
import RepositoryAlbumArt from "@/components/RepositoryAlbumArt";
import Reveal from "@/components/Reveal";
import { getGitHubContributionCalendar } from "@/lib/github-contributions";
import { getGitHubProfile } from "@/lib/github-profile";
import { getGitHubRepositories } from "@/lib/github-repositories";
import { getOAuthSession } from "@/lib/provider-auth";
import IntegrationMenus from "./IntegrationMenus";

export const metadata: Metadata = {
  title: "Overview",
};

export default function Home() {
  return (
    <section className="content-panel">
      <Suspense fallback={<OverviewLoading />}>
        <LibraryOverview />
      </Suspense>
      <Suspense
        fallback={
          <div className="record-integration-loading">
            Loading your GitHub connection…
          </div>
        }
      >
        <ConnectionOverview />
      </Suspense>
    </section>
  );
}

async function LibraryOverview() {
  const [profile, repositories, calendar] = await Promise.all([
    getGitHubProfile(),
    getGitHubRepositories(),
    getGitHubContributionCalendar(),
  ]);
  const name = profile?.name || profile?.login || "music lover";
  const featuredRepository = repositories?.[0];
  const languageCount = new Set(
    repositories?.map((repository) => repository.language).filter(Boolean),
  ).size;
  const totalStars =
    repositories?.reduce((total, repository) => total + repository.stars, 0) ?? 0;

  return (
    <div className="record-overview">
      <header className="record-hero">
        <div className="record-hero-copy">
          <p className="record-eyebrow">Your personal GitHub record store</p>
          <h1>
            Welcome to the
            <br />
            <span>sound of your code.</span>
          </h1>
          <p className="record-hero-description">
            Every project has a rhythm. Turn your repositories into albums and
            the tools behind them into songs.
          </p>
          <div className="record-hero-actions">
            <Link href="/repositories" className="record-button record-button-primary">
              Browse the albums <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/skills" className="record-button record-button-quiet">
              Explore the setlist
            </Link>
          </div>
          <div className="record-welcome">
            {profile ? `Now spinning for ${name}` : "Connect GitHub to start your collection"}
          </div>
        </div>

        <div className="record-hero-art" aria-hidden="true">
          <div className="record-sun" />
          <div className="record-vinyl">
            <div className="record-grooves" />
            <div className="record-label">
              <span>REPO</span>
              <strong>RADIO</strong>
              <span>YOUR CODE · SIDE A</span>
            </div>
          </div>
          <span className="record-note note-one">♪</span>
          <span className="record-note note-two">♫</span>
          <span className="record-hero-caption">EST. IN YOUR TERMINAL</span>
        </div>
      </header>

      <Reveal>
        <section className="record-stat-row" aria-label="Your collection at a glance">
          <article>
            <span className="record-stat-icon">▣</span>
            <div><strong>{repositories?.length ?? "—"}</strong><span>albums in the crate</span></div>
          </article>
          <article>
            <span className="record-stat-icon">♫</span>
            <div><strong>{languageCount || "—"}</strong><span>sounds in your setlist</span></div>
          </article>
          <article>
            <span className="record-stat-icon">✳</span>
            <div><strong>{repositories ? totalStars.toLocaleString() : "—"}</strong><span>stars from the crowd</span></div>
          </article>
          <article>
            <span className="record-stat-icon">↗</span>
            <div>
              <strong>{calendar?.totalContributions.toLocaleString() ?? "—"}</strong>
              <span>contributions this year</span>
            </div>
          </article>
        </section>
      </Reveal>

      <Reveal>
        {featuredRepository ? (
          <section className="record-feature-section">
            <div className="record-section-heading">
              <div>
                <p className="record-eyebrow">Fresh from your collection</p>
                <h2>Your latest release</h2>
              </div>
              <Link href="/repositories" className="record-text-link">
                All repositories <span aria-hidden="true">→</span>
              </Link>
            </div>
            <article className="featured-album">
              <RepositoryAlbumArt repository={featuredRepository} compact />
              <div className="featured-album-copy">
                <span className="featured-album-kicker">LATEST RELEASE · SIDE A</span>
                <h3>{featuredRepository.name}</h3>
                <p>
                  {featuredRepository.description ||
                    "A new project in your collection, ready for its cover art."}
                </p>
                <div className="featured-album-meta">
                  <span>{featuredRepository.language || "Mixed media"}</span>
                  <span>★ {featuredRepository.stars}</span>
                  <span>⑂ {featuredRepository.forks}</span>
                </div>
                <Link
                  href={featuredRepository.url}
                  className="record-button record-button-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on GitHub <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className="featured-sticker" aria-hidden="true">JUST<br />DROPPED</div>
            </article>
          </section>
        ) : (
          <section className="record-first-listen">
            <BeatCat mood="excited" />
            <div>
              <p className="record-eyebrow">The needle is ready</p>
              <h2>Your first album is waiting.</h2>
              <p>Connect GitHub below and we’ll bring your repositories onto the shelf.</p>
            </div>
            <Link href="/repositories" className="record-button record-button-primary">
              Visit the shelf <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}
      </Reveal>

      <Reveal>
        <section className="record-activity-section">
          <div className="record-section-heading">
            <div className={`record-heading-with-cat${calendar ? "" : " is-compact"}`}>
              <BeatCat />
              <div>
                <p className="record-eyebrow">The making of the music</p>
                <h2>Your year in commits</h2>
              </div>
            </div>
            <span className="record-activity-total">
              {calendar
                ? `${calendar.totalContributions.toLocaleString()} contributions`
                : "Connect GitHub to tune in"}
            </span>
          </div>
          <div className="record-activity-card">
            <GitHubContributionGraph calendar={calendar} />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <footer className="record-footer-note">
          <span aria-hidden="true">✳</span>
          AI cover art is made only when you choose “Make cover” on an album.
        </footer>
      </Reveal>
    </div>
  );
}

function OverviewLoading() {
  return (
    <div className="record-overview record-overview-loading" aria-label="Loading your record store">
      <BeatCat mood="confused" />
      <p>Setting the needle…</p>
    </div>
  );
}

async function ConnectionOverview() {
  const github = await getOAuthSession();

  return (
    <Reveal>
      <div className="record-integrations">
        <IntegrationMenus
          github={github
            ? {
                connected: true,
                displayName: github.displayName ?? github.username ?? "GitHub account",
                username: github.username,
              }
            : { connected: false }}
        />
      </div>
    </Reveal>
  );
}
