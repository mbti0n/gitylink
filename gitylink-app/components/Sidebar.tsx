import { Suspense } from "react";
import { getGitHubInitials, getGitHubProfile } from "@/lib/github-profile";
import SidebarNav, { SettingsLink } from "./SidebarNav";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-wrap">
        <div className="brand-mark">↗</div>
        <div className="brand-text">
          <span className="brand-title">gitylink</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-label">WORKSPACE</div>
        <SidebarNav />
      </div>

      <div className="sidebar-section sidebar-bottom">
        <div className="section-label">SETTINGS</div>
        <SettingsLink />
        <button
          className="nav-item compact"
          type="button"
          aria-label="Help and feedback"
          title="Help and feedback"
        >
          <span className="nav-icon">ⓘ</span>
          <span>Help &amp; feedback</span>
        </button>
      </div>

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
