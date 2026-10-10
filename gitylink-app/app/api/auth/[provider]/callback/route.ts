import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  clearOAuthStateCookie,
  getOAuthConfiguration,
  getOAuthStateCookieName,
  isOAuthProvider,
  setOAuthSessionCookie,
  type OAuthProvider,
  type OAuthSession,
} from "@/lib/provider-auth";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

type GitHubTokenResponse = {
  access_token?: string;
};

type GitHubUserResponse = {
  login: string;
  name: string | null;
};

type LinkedInTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

type LinkedInUserInfoResponse = {
  sub?: string;
  name?: string;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { provider: value } = await params;
  if (!isOAuthProvider(value)) {
    return Response.json({ error: "Unknown OAuth provider." }, { status: 404 });
  }

  let configuration;
  try {
    configuration = getOAuthConfiguration(value);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth configuration is invalid.";
    return Response.json({ error: message }, { status: 503 });
  }

  const url = new URL(request.url);
  const returnedState = url.searchParams.get("state");
  const savedState = request.cookies.get(getOAuthStateCookieName(value))?.value;
  if (!statesMatch(returnedState, savedState)) {
    return redirectWithStatus(configuration.baseUrl, "auth-error=invalid-state", value);
  }

  if (url.searchParams.has("error")) {
    return redirectWithStatus(configuration.baseUrl, "auth-error=denied", value);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return redirectWithStatus(configuration.baseUrl, "auth-error=missing-code", value);
  }

  try {
    const session =
      value === "github"
        ? await exchangeGitHubCode(code, configuration)
        : await exchangeLinkedInCode(code, configuration);
    const response = redirectWithStatus(
      configuration.baseUrl,
      `auth=${value}-connected`,
      value,
    );
    setOAuthSessionCookie(response, value, session);
    return response;
  } catch (error) {
    console.error(`${value} OAuth callback failed.`, error);
    return redirectWithStatus(configuration.baseUrl, "auth-error=exchange-failed", value);
  }
}

async function exchangeGitHubCode(
  code: string,
  configuration: ReturnType<typeof getOAuthConfiguration>,
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

async function exchangeLinkedInCode(
  code: string,
  configuration: ReturnType<typeof getOAuthConfiguration>,
): Promise<OAuthSession> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: configuration.callbackUrl,
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
  });
  const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );
  const tokenData = (await tokenResponse.json()) as LinkedInTokenResponse;
  if (
    !tokenResponse.ok ||
    !tokenData.access_token ||
    !tokenData.expires_in ||
    tokenData.expires_in <= 0
  ) {
    throw new Error(`LinkedIn token exchange returned ${tokenResponse.status}.`);
  }

  const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    cache: "no-store",
  });
  const user = (await userResponse.json()) as LinkedInUserInfoResponse;
  if (!userResponse.ok || !user.sub) {
    throw new Error(`LinkedIn profile verification returned ${userResponse.status}.`);
  }

  return {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    username: user.sub,
    displayName: user.name,
  };
}

function statesMatch(returnedState: string | null, savedState: string | undefined) {
  if (!returnedState || !savedState) return false;
  const returned = Buffer.from(returnedState);
  const saved = Buffer.from(savedState);
  return returned.length === saved.length && timingSafeEqual(returned, saved);
}

function redirectWithStatus(
  baseUrl: string,
  query: string,
  provider: OAuthProvider,
) {
  const response = NextResponse.redirect(new URL(`/?${query}`, baseUrl));
  clearOAuthStateCookie(response, provider);
  return response;
}
