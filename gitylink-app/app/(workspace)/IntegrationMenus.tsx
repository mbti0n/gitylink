"use client";

import { useSearchParams } from "next/navigation";

type ConnectionInfo = {
  connected: boolean;
  displayName?: string;
  username?: string;
};

export default function IntegrationMenus({
  github,
}: {
  github: ConnectionInfo;
}) {
  const searchParams = useSearchParams();
  const authStatus = searchParams.get("auth");
  const authError = searchParams.get("auth-error");
  const message = getStatusMessage(authStatus, authError);

  return (
    <section className="page-content integration-page" aria-labelledby="connections-title">
      <div className="integration-overview-heading">
        <p className="eyebrow">Integrations</p>
        <h2 id="connections-title">Connected accounts</h2>
        <p>Manage access to your GitHub activity.</p>
      </div>

      {message && (
        <p
          className={`integration-message${authError ? " is-error" : ""}`}
          role={authError ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <div className="integration-grid">
        <IntegrationCard
          title="GitHub"
          mark="⌁"
          description="Read your public repositories, commits, and contribution activity."
          scopes="Read your profile and public repositories."
          connection={github}
        />
      </div>
      <p className="integration-security-note">
        Access tokens are encrypted in HTTP-only browser cookies and marked Secure over HTTPS.
        Disconnecting removes Gitylink&apos;s local session; you can also revoke access in GitHub
        settings.
      </p>
    </section>
  );
}

function IntegrationCard({
  title,
  mark,
  description,
  scopes,
  connection,
}: {
  title: string;
  mark: string;
  description: string;
  scopes: string;
  connection: ConnectionInfo;
}) {
  return (
    <section className="panel integration-card" aria-labelledby="github-title">
      <div className="integration-mark github" aria-hidden="true">
        {mark}
      </div>
      <div className="integration-card-content">
        <div className="integration-card-title">
          <h2 id="github-title">{title}</h2>
          <span
            className={`integration-status${connection.connected ? " is-connected" : ""}`}
          >
            {connection.connected ? "Connected" : "Not connected"}
          </span>
        </div>
        <p>{description}</p>
        <p className="integration-scopes">{scopes}</p>
        {connection.connected && (
          <p className="integration-account">
            Connected as <strong>{connection.displayName}</strong>
            {connection.username ? ` · @${connection.username}` : ""}
          </p>
        )}
        <div className="integration-actions">
          {connection.connected ? (
            <form action="/api/auth/github" method="post">
              <button type="submit" className="btn btn-secondary">
                Disconnect {title}
              </button>
            </form>
          ) : (
            <form action="/api/auth/github" method="get">
              <button type="submit" className="btn btn-primary">
                Connect {title}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function getStatusMessage(
  status: string | null,
  error: string | null,
): string | null {
  if (error === "denied") return "Authorization was cancelled or denied.";
  if (error === "invalid-state") {
    return "The authorization request expired or could not be verified. Please try again.";
  }
  if (error === "missing-code" || error === "exchange-failed") {
    return "The provider could not complete authorization. Please try again.";
  }
  if (status === "github-connected") return "GitHub was connected successfully.";
  if (status === "github-disconnected") return "GitHub was disconnected.";
  return null;
}
