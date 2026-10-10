import type { ContributionCalendar } from "@/lib/github-contributions";

const levelClasses: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export default function GitHubContributionGraph({
  calendar,
}: {
  calendar: ContributionCalendar | null;
}) {
  if (!calendar) {
    return (
      <p className="github-calendar-message">
        Couldn’t load contribution activity. Connect GitHub from the overview page or reconnect
        your account.
      </p>
    );
  }

  return (
    <>
      <div className="github-calendar-scroll">
        <div
          className="github-calendar"
          role="img"
          aria-label={`GitHub contribution calendar with ${calendar.totalContributions} contributions in the past year`}
        >
          {calendar.weeks.map((week, weekIndex) => {
            const monthDay = week.contributionDays.find((day) => day.date.endsWith("-01"));
            return (
              <div className="github-week" key={weekIndex}>
                <span className="github-month-label">
                  {monthDay
                    ? new Date(`${monthDay.date}T00:00:00`).toLocaleString("en", {
                        month: "short",
                        timeZone: "UTC",
                      })
                    : ""}
                </span>
                {Array.from({ length: 7 }, (_, weekday) => {
                  const day = week.contributionDays.find((entry) => entry.weekday === weekday);
                  const level = day ? levelClasses[day.contributionLevel] ?? 0 : 0;
                  return day ? (
                    <span
                      key={weekday}
                      className={`github-cell github-level-${level}`}
                      title={`${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"} on ${day.date}`}
                      aria-hidden="true"
                    />
                  ) : (
                    <span key={weekday} className="github-cell github-cell-empty" aria-hidden="true" />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="github-legend" aria-hidden="true">
        <span>Less</span>
        <span className="github-cell github-level-0" />
        <span className="github-cell github-level-1" />
        <span className="github-cell github-level-2" />
        <span className="github-cell github-level-3" />
        <span className="github-cell github-level-4" />
        <span>More</span>
      </div>
    </>
  );
}
