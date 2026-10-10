import type { Metadata } from "next";
import { Suspense } from "react";
import Topbar from "@/components/Topbar";
import { getGitHubProfile } from "@/lib/github-profile";
import PostStudio from "./PostStudio";

export const metadata: Metadata = {
  title: "Post studio · Commit to Post",
};

export default function PostStudioPage() {
  return (
    <section className="content-panel">
      <Topbar crumb="Post studio" />
      <Suspense fallback={<div className="panel preview-panel">Loading GitHub profile…</div>}>
        <PostStudioWithGitHub />
      </Suspense>
    </section>
  );
}

async function PostStudioWithGitHub() {
  const profile = await getGitHubProfile();
  return <PostStudio profile={profile} />;
}
