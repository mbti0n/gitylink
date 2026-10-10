import { io } from "next/cache";

type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export type ContributionDay = {
  date: string;
  weekday: number;
  contributionCount: number;
  contributionLevel: ContributionLevel;
};

export type ContributionWeek = {
  contributionDays: ContributionDay[];
};

export type ContributionCalendar = {
  totalContributions: number;
  weeks: ContributionWeek[];
};

type ContributionsResponse = {
  data?: {
    viewer?: {
      contributionsCollection?: {
        contributionCalendar?: ContributionCalendar;
      };
    };
  };
  errors?: { message: string }[];
};

const contributionCalendarQuery = `
  query ContributionCalendar($from: DateTime!, $to: DateTime!) {
    viewer {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

export async function getGitHubContributionCalendar(): Promise<ContributionCalendar | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  await io();
  const to = new Date();
  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 1);

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "gitylink-app",
      },
      body: JSON.stringify({
        query: contributionCalendarQuery,
        variables: { from: from.toISOString(), to: to.toISOString() },
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = (await response.json()) as ContributionsResponse;
    return result.errors?.length
      ? null
      : result.data?.viewer?.contributionsCollection?.contributionCalendar ?? null;
  } catch {
    return null;
  }
}
