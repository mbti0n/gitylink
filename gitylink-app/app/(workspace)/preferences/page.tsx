import type { Metadata } from "next";
import { Suspense } from "react";
import Topbar from "@/components/Topbar";
import { getGitHubProfile } from "@/lib/github-profile";
import Preferences from "./Preferences";

export const metadata: Metadata = {
  title: "Preferences · Commit to Post",
};

export default function PreferencesPage() {
  return (
    <section className="content-panel">
      <Topbar crumb="Preferences" />
      <Suspense fallback={<div className="panel pref-panel">Loading GitHub profile…</div>}>
        <PreferencesWithGitHub />
      </Suspense>
    </section>
  );
}

async function PreferencesWithGitHub() {
  const github = await getGitHubProfile();
  return <Preferences github={github} />;
}
