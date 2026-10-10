import type { Metadata } from "next";
import { Suspense } from "react";
import Topbar from "@/components/Topbar";
import { getGitHubActivity } from "@/lib/github-activity";
import { getGitHubContributionCalendar } from "@/lib/github-contributions";
import Activity from "./Activity";

export const metadata: Metadata = {
  title: "Activity · Commit to Post",
};

export default function ActivityPage() {
  return (
    <section className="content-panel">
      <Topbar crumb="Activity" />
      <Suspense fallback={<div className="panel contrib-panel">Loading contribution activity…</div>}>
        <ActivityWithContributions />
      </Suspense>
    </section>
  );
}

async function ActivityWithContributions() {
  const [contributionCalendar, commits] = await Promise.all([
    getGitHubContributionCalendar(),
    getGitHubActivity(4),
  ]);
  return <Activity contributionCalendar={contributionCalendar} initialCommits={commits ?? []} />;
}
