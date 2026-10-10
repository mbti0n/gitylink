import type { Metadata } from "next";
import { Suspense } from "react";
import Topbar from "@/components/Topbar";
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
  const contributionCalendar = await getGitHubContributionCalendar();
  return <Activity contributionCalendar={contributionCalendar} />;
}
