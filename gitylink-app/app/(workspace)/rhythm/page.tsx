import type { Metadata } from "next";
import { Suspense } from "react";
import { getGitHubMoodProfile } from "@/lib/github-mood";
import RhythmGame from "./RhythmGame";

export const metadata: Metadata = {
  title: "Rhythm Arcade",
};

export default function RhythmPage(props: PageProps<"/rhythm">) {
  return (
    <section className="content-panel">
      {/* Playable right away; the GitHub mood banner fills in once the profile loads */}
      <Suspense fallback={<RhythmGame />}>
        <RhythmGameWithMood searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function RhythmGameWithMood({
  searchParams,
}: {
  searchParams: PageProps<"/rhythm">["searchParams"];
}) {
  const [moodProfile, params] = await Promise.all([getGitHubMoodProfile(), searchParams]);
  // Repo Wrapped's "Play my mood" links here with ?mood=play to compose straight away
  return <RhythmGame moodProfile={moodProfile} autoCompose={params.mood === "play"} />;
}
