import type { GitHubCommit } from "@/lib/github-activity";
import type { ContributionCalendar } from "@/lib/github-contributions";

type MonthDatum = {
  key: string;
  label: string;
  contributions: number;
};

type RepositoryDatum = {
  name: string;
  url: string;
  commits: number;
};

export default function InsightsActivity({
  contributionCalendar,
  recentCommits,
}: {
  contributionCalendar: ContributionCalendar | null;
  recentCommits: GitHubCommit[] | null;
}) {
  const months = getMonthlyContributions(contributionCalendar);
  const maxContributions = Math.max(
    1,
    ...months.map((month) => month.contributions),
  );
  const activityByRepository = new Map<string, RepositoryDatum>();

  for (const commit of recentCommits ?? []) {
    const current = activityByRepository.get(commit.repo);
    if (current) {
      current.commits += 1;
    } else {
      activityByRepository.set(commit.repo, {
        name: commit.repo,
        url: commit.url,
        commits: 1,
      });
    }
  }

  const projectFocus = [...activityByRepository.values()]
    .sort(
      (first, second) =>
        second.commits - first.commits || first.name.localeCompare(second.name),
    )
    .slice(0, 5);
  const maxCommits = Math.max(
    1,
    ...projectFocus.map((repository) => repository.commits),
  );

  return (
    <section className="insights-activity-grid" aria-label="Development activity">
      <article className="insights-card" aria-labelledby="activity-trend-title">
        <div className="insights-card-heading">
          <div>
            <p className="record-eyebrow">YEAR IN REVIEW</p>
            <h2 id="activity-trend-title">Contribution rhythm</h2>
          </div>
          <span className="insights-card-note">
            {contributionCalendar
              ? `${contributionCalendar.totalContributions.toLocaleString()} contributions`
              : "Activity unavailable"}
          </span>
        </div>
        {months.length === 0 ? (
          <p className="insights-no-data">
            Connect or reconnect GitHub to load your contribution calendar.
          </p>
        ) : (
          <div
            className="insights-month-chart"
            role="img"
            aria-label={`Monthly contribution activity for the past year, ${contributionCalendar?.totalContributions.toLocaleString() ?? 0} contributions total`}
          >
            {months.map((month) => (
              <div className="insights-month-column" key={month.key}>
                <span
                  className="insights-month-value"
                  title={`${month.contributions} contributions`}
                >
                  {month.contributions > 0 ? month.contributions : ""}
                </span>
                <span className="insights-month-track">
                  <span
                    className="insights-month-bar"
                    style={{
                      height: `${Math.max(2, (month.contributions / maxContributions) * 100)}%`,
                    }}
                  />
                </span>
                <span className="insights-month-label">{month.label}</span>
              </div>
            ))}
          </div>
        )}
        <p className="insights-chart-caption">
          Monthly GitHub contributions across your account; this includes activity
          beyond commits to the public repositories shown here.
        </p>
      </article>

      <article className="insights-card" aria-labelledby="project-focus-title">
        <div className="insights-card-heading">
          <div>
            <p className="record-eyebrow">RECENT COMMIT SAMPLE</p>
            <h2 id="project-focus-title">Where your code is moving</h2>
          </div>
          <span className="insights-card-note">
            {recentCommits === null
              ? "Activity unavailable"
              : `Up to ${recentCommits.length} commits`}
          </span>
        </div>
        {recentCommits === null ? (
          <p className="insights-no-data">
            Connect or reconnect GitHub to load authored commit activity.
          </p>
        ) : projectFocus.length === 0 ? (
          <p className="insights-no-data">
            No authored commits were found in the recent activity sample.
          </p>
        ) : (
          <ol className="insights-focus-list">
            {projectFocus.map((repository) => (
              <li key={repository.name}>
                <a
                  className="insights-focus-name"
                  href={repository.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {repository.name}
                </a>
                <span className="insights-focus-track">
                  <span
                    className="insights-focus-bar"
                    style={{ width: `${(repository.commits / maxCommits) * 100}%` }}
                  />
                </span>
                <strong>{repository.commits}</strong>
              </li>
            ))}
          </ol>
        )}
        <p className="insights-chart-caption">
          Shows repository share within GitHub’s latest authored-commit sample,
          not a fixed time period or a complete commit history.
        </p>
      </article>
    </section>
  );
}

function getMonthlyContributions(
  calendar: ContributionCalendar | null,
): MonthDatum[] {
  if (!calendar) return [];

  const monthlyCounts = new Map<string, number>();
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      const monthKey = day.date.slice(0, 7);
      monthlyCounts.set(
        monthKey,
        (monthlyCounts.get(monthKey) ?? 0) + day.contributionCount,
      );
    }
  }

  const currentMonth = new Date();
  currentMonth.setUTCDate(1);
  currentMonth.setUTCHours(0, 0, 0, 0);
  currentMonth.setUTCMonth(currentMonth.getUTCMonth() - 11);

  return Array.from({ length: 12 }, (_, index) => {
    const month = new Date(currentMonth);
    month.setUTCMonth(currentMonth.getUTCMonth() + index);
    const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: month.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      }),
      contributions: monthlyCounts.get(key) ?? 0,
    };
  });
}
