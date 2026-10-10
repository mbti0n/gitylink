import type { Metadata } from "next";
import { Suspense } from "react";
import { getGitHubMoodProfile } from "@/lib/github-mood";
import RhythmGame from "./RhythmGame";

export const metadata: Metadata = {
  title: "Rhythm Arcade",
};

export default function RhythmPage() {
  return (
    <section className="content-panel">
      {/* Playable right away; the GitHub mood cards fill in once the profile loads */}
      <Suspense fallback={<RhythmGame />}>
        <RhythmGameWithMood />
      </Suspense>
    </section>
  );
}

async function RhythmGameWithMood() {
  const moodProfile = await getGitHubMoodProfile();
  return <RhythmGame moodProfile={moodProfile} />;
}
