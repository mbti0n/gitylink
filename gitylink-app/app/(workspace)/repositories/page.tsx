import type { Metadata } from "next";
import { Suspense } from "react";
import { getGitHubRepositories } from "@/lib/github-repositories";
import Repositories from "./Repositories";

export const metadata: Metadata = {
  title: "Repositories · Gitylink",
};

export default function RepositoriesPage() {
  return (
    <section className="content-panel">
      <Suspense fallback={<div className="panel repository-loading">Loading your GitHub repositories…</div>}>
        <RepositoriesFromGitHub />
      </Suspense>
    </section>
  );
}

async function RepositoriesFromGitHub() {
  const repositories = await getGitHubRepositories();
  return <Repositories repositories={repositories} />;
}
