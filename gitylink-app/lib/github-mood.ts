import { getGitHubContributionCalendar, type ContributionCalendar } from "@/lib/github-contributions";
import { getGitHubProfile } from "@/lib/github-profile";
import { getGitHubRepositories, type GitHubRepository } from "@/lib/github-repositories";

// A Spotify Wrapped-style read of someone's GitHub year. The Rhythm Arcade shows it as a
// card deck, and /api/generate-rhythm-track feeds it to the AI so the beat matches the mood.

export type MoodCard = {
  kicker: string;
  stat: string;
  line: string;
};

export type GitHubMoodProfile = {
  login: string;
  archetype: string;
  archetypeLine: string;
  genre: string;
  moodWords: string;
  energy: "low" | "medium" | "high";
  bpmMin: number;
  bpmMax: number;
  topLanguages: string[];
  totalContributions: number | null;
  busiestDay: string | null;
  longestStreak: number | null;
  cards: MoodCard[];
  thinkingPhrases: string[];
};

const genreByLanguage: Record<string, string> = {
  TypeScript: "synth-pop",
  JavaScript: "funk",
  Python: "lo-fi hip hop",
  Rust: "industrial techno",
  Go: "minimal house",
  Java: "big band swing",
  "C++": "drum and bass",
  C: "drum and bass",
  Ruby: "neo-soul",
  Swift: "city pop",
  Kotlin: "nu-disco",
  HTML: "indie pop",
  CSS: "dream pop",
  Shell: "garage rock",
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type CalendarStats = {
  total: number;
  busiestDay: string;
  weekendShare: number;
  longestStreak: number;
  averagePerActiveDay: number;
  activeShare: number;
  recentTrend: number;
};

function readCalendar(calendar: ContributionCalendar): CalendarStats {
  const days = calendar.weeks.flatMap((week) => week.contributionDays);
  const weekdayTotals = Array<number>(7).fill(0);
  let activeDays = 0;
  let streak = 0;
  let longestStreak = 0;

  for (const day of days) {
    weekdayTotals[day.weekday] += day.contributionCount;
    if (day.contributionCount > 0) {
      activeDays += 1;
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  const total = calendar.totalContributions;
  const busiestIndex = weekdayTotals.indexOf(Math.max(...weekdayTotals));
  const lastMonth = days.slice(-30).reduce((sum, day) => sum + day.contributionCount, 0);
  const monthlyAverage = total / 12;

  return {
    total,
    busiestDay: weekdays[busiestIndex],
    weekendShare: total > 0 ? (weekdayTotals[0] + weekdayTotals[6]) / total : 0,
    longestStreak,
    averagePerActiveDay: activeDays > 0 ? total / activeDays : 0,
    activeShare: days.length > 0 ? activeDays / days.length : 0,
    recentTrend: monthlyAverage > 0 ? lastMonth / monthlyAverage : 0,
  };
}

function pickArchetype(stats: CalendarStats | null, languageCount: number) {
  if (stats && stats.weekendShare > 0.4) {
    return { archetype: "The Weekend Warrior", line: "You save your best riffs for Saturday.", moodWords: "sunny, carefree, upbeat" };
  }
  if (stats && stats.longestStreak >= 14) {
    return {
      archetype: "The Marathon Mixer",
      line: `${stats.longestStreak} days straight. That's a whole album without skipping a track.`,
      moodWords: "driving, relentless, focused",
    };
  }
  if (languageCount >= 5) {
    return {
      archetype: "The Genre Hopper",
      line: `${languageCount} languages on rotation. Your playlist has no rules.`,
      moodWords: "playful, eclectic, bouncy",
    };
  }
  if (stats && stats.recentTrend > 1.5) {
    return { archetype: "The Comeback Kid", line: "Your last month went platinum.", moodWords: "triumphant, rising, bright" };
  }
  if (stats && stats.averagePerActiveDay >= 6) {
    return { archetype: "The Headliner", line: "When you show up, you play the whole set.", moodWords: "bold, loud, confident" };
  }
  return { archetype: "The Steady Groove", line: "Consistent, smooth, never off-beat.", moodWords: "mellow, warm, steady" };
}

function contributionLine(total: number) {
  if (total >= 1500) return "That's a world tour. The crowd knows every word.";
  if (total >= 600) return "Enough to fill a stadium setlist.";
  if (total >= 150) return "A solid run of club shows.";
  if (total > 0) return "Every great artist starts with open mic night.";
  return "A quiet year in the studio. The best albums take time.";
}

export function buildMoodProfile(
  login: string,
  repositories: GitHubRepository[],
  calendar: ContributionCalendar | null,
): GitHubMoodProfile {
  const languageCounts = new Map<string, number>();
  for (const repository of repositories) {
    if (!repository.language) continue;
    languageCounts.set(repository.language, (languageCounts.get(repository.language) ?? 0) + 1);
  }
  const ranked = [...languageCounts.entries()].sort((first, second) => second[1] - first[1]);
  const topLanguages = ranked.slice(0, 3).map(([language]) => language);
  const topLanguage = topLanguages[0] ?? null;

  const stats = calendar ? readCalendar(calendar) : null;
  const { archetype, line, moodWords } = pickArchetype(stats, languageCounts.size);
  const genre = (topLanguage && genreByLanguage[topLanguage]) || "indie electronic";

  const energyScore = stats ? Math.min(1, stats.averagePerActiveDay / 8) * 0.6 + stats.activeShare * 0.4 : 0.4;
  const energy = energyScore > 0.55 ? "high" : energyScore > 0.28 ? "medium" : "low";
  // Kept beginner-friendly; the game also caps playback at 100 BPM
  const [bpmMin, bpmMax] = energy === "high" ? [92, 100] : energy === "medium" ? [82, 91] : [72, 81];

  const cards: MoodCard[] = [];
  if (topLanguage) {
    cards.push({
      kicker: "Your top language",
      stat: topLanguage,
      line: `${ranked[0][1]} of your ${repositories.length} repos speak it. Your beat comes out ${genre}.`,
    });
  }
  if (stats) {
    cards.push(
      {
        kicker: "Contributions this year",
        stat: stats.total.toLocaleString("en-US"),
        line: contributionLine(stats.total),
      },
      {
        kicker: "Your busiest day",
        stat: stats.busiestDay,
        line: `${stats.busiestDay}s are when you hit play.`,
      },
      {
        kicker: "Longest streak",
        stat: `${stats.longestStreak} ${stats.longestStreak === 1 ? "day" : "days"}`,
        line:
          stats.longestStreak >= 7
            ? "No skips. Not even the interlude."
            : "Short sets, big energy.",
      },
    );
  }
  cards.push({
    kicker: "Your coding mood",
    stat: archetype,
    line: `${line} So your beat is ${genre} at ${bpmMin}–${bpmMax} BPM.`,
  });

  const thinkingPhrases = [
    `Reading ${repositories.length} ${repositories.length === 1 ? "repository" : "repositories"}…`,
    topLanguage ? `Listening to your ${topLanguage}…` : "Listening to your code…",
    stats ? `Counting ${stats.total.toLocaleString("en-US")} contributions…` : "Counting your commits…",
    stats ? `Tuning to your ${stats.busiestDay} energy…` : "Finding your tempo…",
    `Mixing ${genre} for ${archetype}…`,
  ];

  return {
    login,
    archetype,
    archetypeLine: line,
    genre,
    moodWords,
    energy,
    bpmMin,
    bpmMax,
    topLanguages,
    totalContributions: stats?.total ?? null,
    busiestDay: stats?.busiestDay ?? null,
    longestStreak: stats?.longestStreak ?? null,
    cards,
    thinkingPhrases,
  };
}

export async function getGitHubMoodProfile(): Promise<GitHubMoodProfile | null> {
  const [profile, repositories, calendar] = await Promise.all([
    getGitHubProfile(),
    getGitHubRepositories(),
    getGitHubContributionCalendar(),
  ]);
  if (!profile || !repositories) return null;
  return buildMoodProfile(profile.login, repositories, calendar);
}
