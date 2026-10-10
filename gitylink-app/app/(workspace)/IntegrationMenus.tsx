"use client";

import { useSearchParams } from "next/navigation";

type ConnectionInfo = {
  connected: boolean;
  displayName?: string;
  username?: string;
};

export default function IntegrationMenus({
  github,
  linkedin,
}: {
  github: ConnectionInfo;
  linkedin: ConnectionInfo;
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
        <p>Manage access to GitHub activity and LinkedIn sharing.</p>
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
          provider="github"
          title="GitHub"
          mark="⌁"
          description="Read your public repositories, commits, and contribution activity."
          scopes="Read your profile and public repositories."
          connection={github}
        />
        <IntegrationCard
          provider="linkedin"
          title="LinkedIn"
          mark="in"
          description="Authorize your LinkedIn account for profile access and future post publishing."
          scopes="Read your profile and request permission to publish posts."
          connection={linkedin}
        />
      </div>
      <p className="integration-security-note">
        Access tokens are encrypted in HTTP-only browser cookies and marked Secure over HTTPS.
        Disconnecting removes Gitylink&apos;s local session; you can also revoke access in each
        provider&apos;s settings.
      </p>
    </section>
  );
}

function IntegrationCard({
  provider,
  title,
  mark,
  description,
  scopes,
  connection,
}: {
  provider: "github" | "linkedin";
  title: string;
  mark: string;
  description: string;
  scopes: string;
  connection: ConnectionInfo;
}) {
  return (
    <section className="panel integration-card" aria-labelledby={`${provider}-title`}>
      <div className={`integration-mark ${provider}`} aria-hidden="true">
        {mark}
      </div>
      <div className="integration-card-content">
        <div className="integration-card-title">
          <h2 id={`${provider}-title`}>{title}</h2>
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
            {provider === "github" && connection.username
              ? ` · @${connection.username}`
              : ""}
          </p>
        )}
        <div className="integration-actions">
          {connection.connected ? (
            <form action={`/api/auth/${provider}`} method="post">
              <button type="submit" className="btn btn-secondary">
                Disconnect {title}
              </button>
            </form>
          ) : (
            <form action={`/api/auth/${provider}`} method="get">
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
  if (status === "linkedin-connected") return "LinkedIn was connected successfully.";
  if (status === "github-disconnected") return "GitHub was disconnected.";
  if (status === "linkedin-disconnected") return "LinkedIn was disconnected.";
  return null;
}
