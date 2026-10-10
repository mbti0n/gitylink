import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  clearOAuthStateCookie,
  getOAuthConfiguration,
  getOAuthStateCookieName,
  setOAuthSessionCookie,
  type OAuthConfiguration,
  type OAuthSession,
} from "@/lib/provider-auth";

type GitHubTokenResponse = {
  access_token?: string;
};

type GitHubUserResponse = {
  login: string;
  name: string | null;
};

export async function GET(request: NextRequest) {
  let configuration: OAuthConfiguration;
  try {
    configuration = getOAuthConfiguration();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth configuration is invalid.";
    return Response.json({ error: message }, { status: 503 });
  }

  const url = new URL(request.url);
  const returnedState = url.searchParams.get("state");
  const savedState = request.cookies.get(getOAuthStateCookieName())?.value;
  if (!statesMatch(returnedState, savedState)) {
    return redirectWithStatus(configuration.baseUrl, "auth-error=invalid-state");
  }

  if (url.searchParams.has("error")) {
    return redirectWithStatus(configuration.baseUrl, "auth-error=denied");
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return redirectWithStatus(configuration.baseUrl, "auth-error=missing-code");
  }

  try {
    const session = await exchangeGitHubCode(code, configuration);
    const response = redirectWithStatus(
      configuration.baseUrl,
      "auth=github-connected",
    );
    setOAuthSessionCookie(response, session);
    return response;
  } catch (error) {
    console.error("GitHub OAuth callback failed.", error);
    return redirectWithStatus(configuration.baseUrl, "auth-error=exchange-failed");
  }
}

async function exchangeGitHubCode(
  code: string,
  configuration: OAuthConfiguration,
): Promise<OAuthSession> {
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        code,
        redirect_uri: configuration.callbackUrl,
      }),
      cache: "no-store",
    },
  );
  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(`GitHub token exchange returned ${tokenResponse.status}.`);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  const user = (await userResponse.json()) as GitHubUserResponse;
  if (!userResponse.ok || !user.login) {
    throw new Error(`GitHub profile verification returned ${userResponse.status}.`);
  }

  return {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    username: user.login,
    displayName: user.name || user.login,
  };
}

function statesMatch(returnedState: string | null, savedState: string | undefined) {
  if (!returnedState || !savedState) return false;
  const returned = Buffer.from(returnedState);
  const saved = Buffer.from(savedState);
  return returned.length === saved.length && timingSafeEqual(returned, saved);
}

function redirectWithStatus(baseUrl: string, query: string) {
  const response = NextResponse.redirect(new URL(`/?${query}`, baseUrl));
  clearOAuthStateCookie(response);
  return response;
}
