import Link from "next/link";
import { Suspense } from "react";
import Topbar from "@/components/Topbar";
import GitHubContributionGraph from "@/components/GitHubContributionGraph";
import { getGitHubContributionCalendar } from "@/lib/github-contributions";
import { getGitHubProfile } from "@/lib/github-profile";

const metrics = [
  { icon: "▤", value: "12", label: "Repositories tracked", tone: "blue" },
  { icon: "⌁", value: "148", label: "Commits this month", tone: "green" },
  { icon: "✦", value: "8", label: "Post opportunities", tone: "amber" },
  { icon: "◈", value: "24", label: "Skills discovered", tone: "blue" },
];

const shareCards = [
  {
    repo: "portfolio-website",
    time: "2 hours ago",
    title: "Shipped my new personal portfolio",
    description:
      "You built responsive pages, refined animations, and deployed the finished site.",
    tags: ["React", "TypeScript"],
  },
  {
    repo: "task-manager-api",
    time: "Yesterday",
    title: "Finally fixed JWT authentication",
    description:
      "After several debugging sessions, your authorization flow is working end to end.",
    tags: ["Node.js", "Security"],
  },
  {
    repo: "docker-homelab",
    time: "3 days ago",
    title: "Automated my development environment",
    description:
      "You added container configuration and reduced manual environment setup.",
    tags: ["Docker", "DevOps"],
  },
];

export default function Home() {
  return (
    <section className="content-panel">
      <Topbar crumb="Overview" />

      <div className="hero-row">
        <div>
          <Suspense fallback={<h1>Good evening 👋</h1>}>
            <WelcomeHeading />
          </Suspense>
          <p>Turn your work into stories worth sharing.</p>
        </div>
        <Link href="/post-studio" className="primary-btn">+ Create a post</Link>
      </div>

      <div className="stats-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className={`stat-card tone-${metric.tone}`}>
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-number">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
          </article>
        ))}
      </div>

      <section className="activity-block">
        <div className="activity-header">
          <div>
            <h2>Your development activity</h2>
            <p>Across all your connected repositories</p>
          </div>
        </div>

        <div className="activity-layout">
          <Suspense fallback={<div className="overview-card">Loading contribution activity…</div>}>
            <ContributionOverview />
          </Suspense>

          <aside className="insight-card">
            <div className="insight-title">✦ This week&apos;s highlight</div>
            <div className="story-tag">Suggested story</div>
            <div className="story-line">You turned 4 days of debugging</div>
            <div className="story-line">into a working auth flow.</div>
            <p>A great learning milestone to share.</p>
            <Link href="/post-studio" className="secondary-btn">Generate story →</Link>
          </aside>
        </div>
      </section>

      <div className="share-header">
        <h3>Ready to share</h3>
        <a href="#">View all →</a>
      </div>

      <div className="share-grid">
        {shareCards.map((card) => (
          <article key={card.repo} className="share-card">
            <div className="share-topline">
              <span className="repo-bullet">⌁</span>
              <span className="repo-name">{card.repo}</span>
              <span className="repo-time">{card.time}</span>
            </div>

            <h4>{card.title}</h4>
            <p>{card.description}</p>

            <div className="tag-row">
              {card.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            <Link href="/post-studio" className="draft-btn">Draft post →</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

async function WelcomeHeading() {
  const profile = await getGitHubProfile();
  const name = profile?.name || profile?.login || "there";
  return <h1>Good evening, {name} 👋</h1>;
}

async function ContributionOverview() {
  const contributionCalendar = await getGitHubContributionCalendar();

  return (
    <div className="overview-card">
      <div className="card-header">
        <span>Contribution overview</span>
        <span className="muted">
          {contributionCalendar
            ? `${contributionCalendar.totalContributions.toLocaleString()} contributions in the past year`
            : "GitHub activity unavailable"}
        </span>
      </div>

      <GitHubContributionGraph calendar={contributionCalendar} />
    </div>
  );
}
