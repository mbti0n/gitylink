"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  getRepositoryCoverStorageKey,
  optimizeCover,
} from "@/components/RepositoryAlbumArt";

type OwnerStats = {
  owner: string;
  url: string;
  publicRepositories: number;
  latestRepository: {
    id: number;
    name: string;
    updatedAt: string;
  } | null;
  latestRepositoryError?: string;
};

type OwnerComparison = {
  first: OwnerStats;
  second: OwnerStats;
};

type BattleSummary = {
  headline: string;
  summary: string;
};

type OwnerCoverResult = {
  repositoryId: number | null;
  cover?: string;
  error?: string;
};

export default function RepoBattle() {
  const [firstOwner, setFirstOwner] = useState("");
  const [secondOwner, setSecondOwner] = useState("");
  const [comparison, setComparison] = useState<OwnerComparison | null>(null);
  const [battleSummary, setBattleSummary] = useState<BattleSummary | null>(null);
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [coverErrors, setCoverErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const comparisonId = useRef(0);

  async function compareOwners(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentComparisonId = ++comparisonId.current;
    setIsLoading(true);
    setError("");
    setSummaryError("");
    setComparison(null);
    setBattleSummary(null);
    setCovers({});
    setCoverErrors([]);

    try {
      const response = await fetch("/api/compare-owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstOwner, secondOwner }),
      });
      const result = (await response.json()) as OwnerComparison | { error?: string };
      if (!response.ok || !("first" in result) || !("second" in result)) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Could not compare these GitHub owners.",
        );
      }
      setComparison(result);
      for (const owner of [result.first, result.second]) {
        void loadOwnerCover(owner).then((coverResult) => {
          if (comparisonId.current !== currentComparisonId) return;
          if (coverResult.repositoryId !== null && coverResult.cover) {
            setCovers((previous) => ({
              ...previous,
              [coverResult.repositoryId!]: coverResult.cover!,
            }));
          }
          if (coverResult.error) {
            setCoverErrors((previous) => [...previous, coverResult.error!]);
          }
        });
      }

      setIsSummaryLoading(true);
      try {
        const summaryResponse = await fetch("/api/repository-battle-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstOwner: result.first.owner, secondOwner: result.second.owner }),
        });
        const summaryResult = (await summaryResponse.json()) as {
          summary?: BattleSummary;
          error?: string;
        };
        if (!summaryResponse.ok || !summaryResult.summary) {
          throw new Error(
            summaryResult.error || "Could not write the AI repository matchup.",
          );
        }
        if (comparisonId.current === currentComparisonId) {
          setBattleSummary(summaryResult.summary);
        }
      } catch (summaryRequestError) {
        if (comparisonId.current === currentComparisonId) {
          setSummaryError(
            summaryRequestError instanceof Error
              ? summaryRequestError.message
              : "Could not write the AI repository matchup. Try again.",
          );
        }
      } finally {
        if (comparisonId.current === currentComparisonId) {
          setIsSummaryLoading(false);
        }
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not compare these GitHub owners. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const totalRepositories = comparison
    ? comparison.first.publicRepositories + comparison.second.publicRepositories
    : 0;
  const firstPercentage =
    totalRepositories > 0 && comparison
      ? (comparison.first.publicRepositories / totalRepositories) * 100
      : 50;
  const secondPercentage = 100 - firstPercentage;
  const firstLabelPosition = getPieLabelPosition(firstPercentage, true);
  const secondLabelPosition = getPieLabelPosition(firstPercentage, false);

  return (
    <div className="record-page repo-battle-page">
      <header className="record-page-heading">
        <div>
          <p className="record-eyebrow">THE GREAT REPOSITORY SHOWDOWN</p>
          <h1>Repo Battle</h1>
          <p>Pick two GitHub owners and see who has the bigger public repo collection.</p>
        </div>
        <div className="record-page-stamp" aria-hidden="true">
          OWNER<br />VS OWNER
        </div>
      </header>

      <section className="insights-card repo-battle-card" aria-labelledby="battle-title">
        <div className="insights-card-heading">
          <div>
            <p className="record-eyebrow">PUBLIC REPOSITORY COUNT</p>
            <h2 id="battle-title">Who’s got more repos?</h2>
          </div>
          <span className="insights-card-note">Compare a GitHub user or organization</span>
        </div>

        <form className="repo-battle-form" onSubmit={compareOwners}>
          <label>
            <span>GitHub owner A</span>
            <input
              autoComplete="off"
              maxLength={39}
              placeholder="e.g. vercel"
              required
              value={firstOwner}
              onChange={(event) => setFirstOwner(event.target.value)}
            />
          </label>
          <span className="repo-battle-versus" aria-hidden="true">VS</span>
          <label>
            <span>GitHub owner B</span>
            <input
              autoComplete="off"
              maxLength={39}
              placeholder="e.g. facebook"
              required
              value={secondOwner}
              onChange={(event) => setSecondOwner(event.target.value)}
            />
          </label>
          <button
            className="record-button record-button-primary"
            type="submit"
            disabled={isLoading || isSummaryLoading}
          >
            {isSummaryLoading
              ? "AI is calling the matchup…"
              : isLoading
                ? "Counting repos…"
                : "Start battle"}
            {!isLoading && !isSummaryLoading && <span aria-hidden="true">↗</span>}
          </button>
        </form>
        <p className="repo-battle-hint">
          Enter GitHub usernames or organization names. Only public repositories are counted.
        </p>
        {error && <p className="insights-compare-error" role="alert">{error}</p>}

        {comparison && (
          <div className="repo-battle-results" aria-live="polite">
            <div
              className="repo-battle-pie"
              role="img"
              aria-label={`${comparison.first.owner} has ${comparison.first.publicRepositories} public repositories and ${comparison.second.owner} has ${comparison.second.publicRepositories} public repositories`}
              style={{
                background:
                  totalRepositories > 0
                    ? `conic-gradient(var(--battle-orange) 0% ${firstPercentage}%, var(--battle-green) ${firstPercentage}% 100%)`
                    : "conic-gradient(var(--battle-orange) 0% 50%, var(--battle-green) 50% 100%)",
              }}
            >
              <span
                className="repo-battle-pie-label is-first"
                style={firstLabelPosition}
                aria-hidden="true"
              >
                {firstPercentage.toFixed(1)}%
              </span>
              <span
                className="repo-battle-pie-label is-second"
                style={secondLabelPosition}
                aria-hidden="true"
              >
                {secondPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="repo-battle-scoreboard">
              <OwnerScore
                owner={comparison.first}
                side="A"
                share={firstPercentage}
                cover={
                  comparison.first.latestRepository
                    ? covers[comparison.first.latestRepository.id]
                    : undefined
                }
              />
              <span className="repo-battle-vs-divider">VS</span>
              <OwnerScore
                owner={comparison.second}
                side="B"
                share={secondPercentage}
                cover={
                  comparison.second.latestRepository
                    ? covers[comparison.second.latestRepository.id]
                    : undefined
                }
              />
            </div>
            {(isSummaryLoading || battleSummary || summaryError) && (
              <section
                className="repo-battle-ai-summary"
                aria-labelledby="repo-battle-ai-heading"
                aria-live="polite"
              >
                <p className="record-eyebrow">THE AI’S POST-MATCH PRESS CONFERENCE</p>
                {isSummaryLoading ? (
                  <p className="repo-battle-ai-status" role="status">
                    Reading both repo piles and preparing an extremely scientific roast…
                  </p>
                ) : battleSummary ? (
                  <>
                    <h3 id="repo-battle-ai-heading">{battleSummary.headline}</h3>
                    <p>{battleSummary.summary}</p>
                  </>
                ) : (
                  <p className="repo-battle-ai-error" role="alert">{summaryError}</p>
                )}
              </section>
            )}
            {coverErrors.map((coverError) => (
              <p className="repo-battle-cover-status" key={coverError} role="status">
                {coverError}
              </p>
            ))}
            <p className="repo-battle-caption">
              Pie slices show each owner’s share of the {totalRepositories.toLocaleString()} public
              repositories counted between them.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function getPieLabelPosition(
  firstShare: number,
  isFirst: boolean,
): CSSProperties {
  const share = isFirst ? firstShare : 100 - firstShare;
  const midpoint = isFirst
    ? firstShare * 1.8 - 90
    : firstShare * 1.8 + 90;
  const angle = (share === 0 ? midpoint + (isFirst ? -8 : 8) : midpoint) * (Math.PI / 180);
  const radius = 30;
  return {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius}%`,
  };
}

function OwnerScore({
  owner,
  side,
  share,
  cover,
}: {
  owner: OwnerStats;
  side: "A" | "B";
  share: number;
  cover?: string;
}) {
  return (
    <a
      className={`repo-battle-owner repo-battle-owner-${side.toLowerCase()}${cover ? " has-cover" : ""}`}
      style={
        cover
          ? {
              backgroundImage: `linear-gradient(rgba(17, 21, 19, 0.72), rgba(17, 21, 19, 0.72)), url("${cover}")`,
            }
          : undefined
      }
      href={owner.url}
      target="_blank"
      rel="noreferrer"
    >
      <span>OWNER {side}</span>
      <strong>{owner.owner}</strong>
      <b>{owner.publicRepositories.toLocaleString()}</b>
      <small>public repos</small>
      <small>{share.toFixed(1)}% of total</small>
      {owner.latestRepository && (
        <small className="repo-battle-latest-repo">
          Latest: {owner.latestRepository.name}
        </small>
      )}
    </a>
  );
}

async function loadOwnerCover(owner: OwnerStats): Promise<OwnerCoverResult> {
  const repository = owner.latestRepository;
  if (!repository) {
    return {
      repositoryId: null,
      error: owner.latestRepositoryError
        ? `Latest repo artwork for ${owner.owner} is unavailable: ${owner.latestRepositoryError}`
        : undefined,
    };
  }

  let storageUnavailable = false;
  try {
    const savedCover = window.localStorage.getItem(
      getRepositoryCoverStorageKey(repository.id),
    );
    if (savedCover) return { repositoryId: repository.id, cover: savedCover };
  } catch {
    storageUnavailable = true;
  }

  try {
    const response = await fetch("/api/repository-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: owner.owner, name: repository.name }),
    });
    const result = (await response.json()) as {
      data?: string;
      mimeType?: string;
      error?: string;
    };
    if (!response.ok || !result.data || !result.mimeType) {
      throw new Error(result.error || "Could not generate the album cover.");
    }

    const cover = await optimizeCover(`data:${result.mimeType};base64,${result.data}`);
    try {
      window.localStorage.setItem(getRepositoryCoverStorageKey(repository.id), cover);
    } catch {
      storageUnavailable = true;
    }

    return {
      repositoryId: repository.id,
      cover,
      error: storageUnavailable
        ? `Generated cover for ${owner.owner}/${repository.name}, but browser storage is unavailable, so it won’t be reused.`
        : undefined,
    };
  } catch (coverError) {
    return {
      repositoryId: repository.id,
      error: `Album cover for ${owner.owner}/${repository.name} couldn’t load: ${
        coverError instanceof Error
          ? coverError.message
          : "Could not generate the album cover."
      }`,
    };
  }
}
