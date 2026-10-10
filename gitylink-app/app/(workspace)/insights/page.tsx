import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BeatCat from "@/components/BeatCat";
import { getGitHubRepositories } from "@/lib/github-repositories";
import { getLanguageColor } from "@/lib/language-colors";
import InsightsProjects from "./InsightsProjects";

export const metadata: Metadata = {
  title: "Repo Insights",
};

type LanguageDatum = {
  name: string;
  repositories: number;
  color: string;
};

export default function InsightsPage() {
  return (
    <section className="content-panel">
      <Suspense fallback={<InsightsLoading />}>
        <InsightsDashboard />
      </Suspense>
    </section>
  );
}

async function InsightsDashboard() {
  const repositories = await getGitHubRepositories();
  const languageCounts = new Map<string, number>();

  for (const repository of repositories ?? []) {
    if (!repository.language) continue;
    languageCounts.set(
      repository.language,
      (languageCounts.get(repository.language) ?? 0) + 1,
    );
  }

  const allLanguages: LanguageDatum[] = [...languageCounts.entries()]
    .map(([name, count]) => ({
      name,
      repositories: count,
      color: getLanguageColor(name),
    }))
    .sort(
      (first, second) =>
        second.repositories - first.repositories ||
        first.name.localeCompare(second.name),
    );
  const displayedLanguages = allLanguages.slice(0, 6);
  const otherLanguageCount = allLanguages
    .slice(6)
    .reduce((total, language) => total + language.repositories, 0);
  if (otherLanguageCount > 0) {
    displayedLanguages.push({
      name: "Other languages",
      repositories: otherLanguageCount,
      color: "#887969",
    });
  }

  const languageRepositoryCount = allLanguages.reduce(
    (total, language) => total + language.repositories,
    0,
  );
  const donutGradient = createDonutGradient(
    displayedLanguages,
    languageRepositoryCount,
  );
  const maxLanguageCount = Math.max(
    1,
    ...displayedLanguages.map((language) => language.repositories),
  );
  const totalStars = (repositories ?? []).reduce(
    (total, repository) => total + repository.stars,
    0,
  );

  return (
    <div className="record-page insights-page">
      <header className="record-page-heading">
        <div>
          <p className="record-eyebrow">Your portfolio, in perspective</p>
          <h1>Repo Insights</h1>
          <p>
            A clear snapshot of the languages and projects in your public
            repository collection.
          </p>
        </div>
        <div className="record-page-stamp" aria-hidden="true">
          DATA<br />EDITION
        </div>
      </header>

      {repositories === null ? (
        <div className="record-empty">
          <BeatCat mood="confused" />
          <h2>Connect GitHub to see your insights</h2>
          <p>Your repository data will appear here once GitHub is connected.</p>
          <Link href="/" className="record-button record-button-primary">
            Connect on overview <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <>
          <section className="insights-metrics" aria-label="Portfolio summary">
            <article className="insights-metric">
              <span>PUBLIC REPOSITORIES</span>
              <strong>{repositories.length}</strong>
              <small>Original projects in your collection</small>
            </article>
            <article className="insights-metric">
              <span>PRIMARY LANGUAGES</span>
              <strong>{allLanguages.length}</strong>
              <small>
                Across {languageRepositoryCount} repositories with a language set
              </small>
            </article>
            <article className="insights-metric">
              <span>TOTAL STARS</span>
              <strong>{totalStars.toLocaleString()}</strong>
              <small>Combined stars across these repositories</small>
            </article>
          </section>

          {repositories.length === 0 ? (
            <div className="record-empty insights-empty">
              <h2>No public repositories to analyze yet</h2>
              <p>Public repositories you own will show up here after GitHub is connected.</p>
            </div>
          ) : (
            <>
              <div className="insights-chart-grid">
                <section className="insights-card" aria-labelledby="language-mix-title">
                  <div className="insights-card-heading">
                    <div>
                      <p className="record-eyebrow">PORTFOLIO MIX</p>
                      <h2 id="language-mix-title">Language distribution</h2>
                    </div>
                    <span className="insights-card-note">
                      {languageRepositoryCount} repos with a primary language
                    </span>
                  </div>
                  {languageRepositoryCount === 0 ? (
                    <p className="insights-no-data">
                      No primary language data is available for these repositories.
                    </p>
                  ) : (
                    <div className="insights-donut-layout">
                      <div
                        className="insights-donut"
                        role="img"
                        aria-label={`Language distribution across ${languageRepositoryCount} repositories`}
                        style={{ background: donutGradient }}
                      >
                        <div>
                          <strong>{languageRepositoryCount}</strong>
                          <span>repositories</span>
                        </div>
                      </div>
                      <ul className="insights-legend">
                        {displayedLanguages.map((language) => {
                          const percentage = Math.round(
                            (language.repositories / languageRepositoryCount) * 100,
                          );
                          return (
                            <li key={language.name}>
                              <span
                                className="insights-legend-swatch"
                                style={{ backgroundColor: language.color }}
                                aria-hidden="true"
                              />
                              <span className="insights-legend-name">
                                {language.name}
                              </span>
                              <strong>{percentage}%</strong>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <p className="insights-chart-caption">
                    Share of repositories by GitHub’s primary-language label;
                    this is not a measure of lines of code.
                  </p>
                </section>

                <section className="insights-card" aria-labelledby="language-count-title">
                  <div className="insights-card-heading">
                    <div>
                      <p className="record-eyebrow">PROJECT COUNT</p>
                      <h2 id="language-count-title">Projects by language</h2>
                    </div>
                    <span className="insights-card-note">Repositories</span>
                  </div>
                  {languageRepositoryCount === 0 ? (
                    <p className="insights-no-data">
                      Language comparisons will appear when GitHub reports primary
                      languages for your repositories.
                    </p>
                  ) : (
                    <div className="insights-bars" role="list">
                      {displayedLanguages.map((language) => (
                        <div
                          className="insights-bar-row"
                          key={language.name}
                          role="listitem"
                        >
                          <span className="insights-bar-label">{language.name}</span>
                          <span className="insights-bar-track">
                            <span
                              className="insights-bar-fill"
                              style={{
                                width: `${(language.repositories / maxLanguageCount) * 100}%`,
                                backgroundColor: language.color,
                              }}
                            />
                          </span>
                          <strong>{language.repositories}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="insights-chart-caption">
                    Languages are grouped from each repository’s primary-language
                    field. Smaller groups may be combined as “Other languages.”
                  </p>
                </section>
              </div>

              <InsightsProjects repositories={repositories} />
            </>
          )}
          <p className="insights-source-note">
            Source: your connected GitHub account’s public repositories. Forks
            and private repositories are excluded.
          </p>
        </>
      )}
    </div>
  );
}

function InsightsLoading() {
  return (
    <div className="record-page record-overview-loading" aria-label="Loading repository insights">
      <BeatCat mood="confused" />
      <p>Putting your portfolio in perspective…</p>
    </div>
  );
}

function createDonutGradient(
  languages: LanguageDatum[],
  total: number,
): string {
  if (total === 0 || languages.length === 0) {
    return "conic-gradient(var(--rr-card-soft) 0% 100%)";
  }

  let currentPercentage = 0;
  const stops = languages.map((language) => {
    const start = currentPercentage;
    currentPercentage += (language.repositories / total) * 100;
    return `${language.color} ${start.toFixed(2)}% ${currentPercentage.toFixed(2)}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}
