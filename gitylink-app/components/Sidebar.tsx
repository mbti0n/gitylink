import Image from "next/image";
import { Suspense } from "react";
import { getGitHubInitials, getGitHubProfile } from "@/lib/github-profile";
import SidebarNav from "./SidebarNav";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-wrap">
        {/* Both logos render; CSS shows the one matching <html data-theme> */}
        <div className="brand-mark brand-logo">
          <Image className="brand-logo-light" src="/logo-light.svg" alt="" width={52} height={52} priority />
          <Image className="brand-logo-dark" src="/logo-dark.svg" alt="" width={52} height={52} priority />
        </div>
        <div className="brand-text">
          <span className="brand-title">Repo Radio</span>
          <span className="brand-subtitle">The Beat Behind Your Builds</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-label">WORKSPACE</div>
        <SidebarNav />
      </div>

      <ThemeToggle />

      <Suspense
        fallback={
          <div className="account-card">
            <div className="avatar">GH</div>
            <div className="account-meta">
              <span className="account-name">GitHub account</span>
              <span className="account-status">Loading profile…</span>
            </div>
          </div>
        }
      >
        <GitHubAccount />
      </Suspense>
    </aside>
  );
}

async function GitHubAccount() {
  const profile = await getGitHubProfile();
  const name = profile?.name || profile?.login || "GitHub account";

  return (
    <div className="account-card">
      <div className="avatar">{getGitHubInitials(name) || "GH"}</div>
      <div className="account-meta">
        <span className="account-name">{name}</span>
        <span className="account-status">
          {profile ? `@${profile.login}` : "GitHub profile unavailable"}
        </span>
      </div>
    </div>
  );
}
