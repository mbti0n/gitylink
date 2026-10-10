import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BeatCat from "@/components/BeatCat";
import { getGitHubMoodProfile } from "@/lib/github-mood";
import RepoWrapped from "./RepoWrapped";

export const metadata: Metadata = {
  title: "Repo Wrapped",
};

export default function WrappedPage() {
  return (
    <section className="content-panel">
      <div className="wrapped-page">
        <Suspense fallback={<WrappedLoading />}>
          <WrappedFromGitHub />
        </Suspense>
      </div>
    </section>
  );
}

async function WrappedFromGitHub() {
  const mood = await getGitHubMoodProfile();

  if (!mood) {
    return (
      <div className="record-empty wrapped-empty">
        <BeatCat mood="confused" />
        <h2>Your year is waiting to be wrapped</h2>
        <p>Connect GitHub on the overview page and we’ll turn your repositories and commits into a year in review.</p>
        <Link href="/" className="record-button record-button-primary">
          Connect on overview <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return <RepoWrapped mood={mood} />;
}

function WrappedLoading() {
  return (
    <div className="record-overview-loading" aria-label="Loading your Repo Wrapped">
      <BeatCat />
      <p>Reading your GitHub year…</p>
    </div>
  );
}
