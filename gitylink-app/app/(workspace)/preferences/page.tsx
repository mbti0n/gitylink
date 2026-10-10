import type { Metadata } from "next";
import { Suspense } from "react";
import { getGitHubProfile } from "@/lib/github-profile";
import Preferences from "./Preferences";

export const metadata: Metadata = {
  title: "Preferences · Gitylink",
};

export default function PreferencesPage() {
  return (
    <section className="content-panel">
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
