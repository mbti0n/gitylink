import type { Metadata } from "next";
import { Suspense } from "react";
import { getGitHubProfile } from "@/lib/github-profile";
import { getOAuthSession } from "@/lib/provider-auth";
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
  const [github, githubSession, linkedinSession] = await Promise.all([
    getGitHubProfile(),
    getOAuthSession("github"),
    getOAuthSession("linkedin"),
  ]);
  return (
    <Preferences
      github={github}
      githubConnected={Boolean(githubSession)}
      linkedinConnected={Boolean(linkedinSession)}
      linkedinName={linkedinSession?.displayName}
    />
  );
}
