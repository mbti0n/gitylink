import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { getGitHubInitials, getGitHubProfile } from "@/lib/github-profile";
import { getOAuthSession } from "@/lib/provider-auth";
import SidebarNav from "./SidebarNav";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand-wrap" href="/" aria-label="Repo Radio overview">
        {/* Both logos render; CSS shows the one matching <html data-theme> */}
        <div className="brand-mark brand-logo">
          <Image className="brand-logo-light" src="/logo-light.svg" alt="" width={52} height={52} priority />
          <Image className="brand-logo-dark" src="/logo-dark.svg" alt="" width={52} height={52} priority />
        </div>
        <div className="brand-text">
          <span className="brand-title">Repo Radio</span>
          <span className="brand-subtitle">The Beat Behind Your Builds</span>
        </div>
      </Link>

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
  const [session, profile] = await Promise.all([
    getOAuthSession(),
    getGitHubProfile(),
  ]);

  if (!session) {
    return (
      <Link className="account-card account-card-link" href="/api/auth/github">
        <div className="avatar">GH</div>
        <div className="account-meta">
          <span className="account-name">GitHub account</span>
          <span className="account-status">Connect GitHub</span>
        </div>
      </Link>
    );
  }

  const name =
    profile?.name || profile?.login || session.displayName || session.username || "GitHub account";

  return (
    <div className="account-card">
      <div className="avatar">{getGitHubInitials(name) || "GH"}</div>
      <div className="account-meta">
        <span className="account-name">{name}</span>
        <span className="account-status">@{profile?.login || session.username || "connected"}</span>
      </div>
      <form action="/api/auth/github" method="post" className="account-logout-form">
        <button className="account-logout" type="submit" aria-label="Log out of GitHub" title="Log out">
          <LogOut size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
