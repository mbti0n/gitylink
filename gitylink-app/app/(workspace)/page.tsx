import { Suspense } from "react";
import { getOAuthSession } from "@/lib/provider-auth";
import IntegrationMenus from "./IntegrationMenus";

export default function Home() {
  return (
    <section className="content-panel">
      <Suspense
        fallback={
          <div className="page-content">
            <div className="panel integration-loading">Loading integrations…</div>
          </div>
        }
      >
        <ConnectionOverview />
      </Suspense>
    </section>
  );
}

async function ConnectionOverview() {
  const [github, linkedin] = await Promise.all([
    getOAuthSession("github"),
    getOAuthSession("linkedin"),
  ]);

  return (
    <IntegrationMenus
      github={
        github
          ? {
              connected: true,
              displayName: github.displayName ?? github.username ?? "GitHub account",
              username: github.username,
            }
          : { connected: false }
      }
      linkedin={
        linkedin
          ? {
              connected: true,
              displayName: linkedin.displayName ?? "LinkedIn account",
            }
          : { connected: false }
      }
    />
  );
}
