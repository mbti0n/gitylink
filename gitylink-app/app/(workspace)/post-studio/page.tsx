import type { Metadata } from "next";
import { Suspense } from "react";
import { getGitHubProfile } from "@/lib/github-profile";
import { getGitHubRepositories } from "@/lib/github-repositories";
import PostStudio from "./PostStudio";

export const metadata: Metadata = {
  title: "Post studio · Gitylink",
};

export default function PostStudioPage() {
  return (
    <section className="content-panel">
      <Suspense fallback={<div className="panel preview-panel">Loading GitHub profile…</div>}>
        <PostStudioWithGitHub />
      </Suspense>
    </section>
  );
}

async function PostStudioWithGitHub() {
  const [profile, repositories] = await Promise.all([
    getGitHubProfile(),
    getGitHubRepositories(),
  ]);
  return <PostStudio profile={profile} repositories={repositories} />;
}
