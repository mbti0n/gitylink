import { NextResponse } from "next/server";
import {
  clearOAuthCookies,
  createOAuthState,
  getOAuthConfiguration,
  getOAuthStateCookieName,
  isOAuthProvider,
} from "@/lib/provider-auth";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
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

  const state = createOAuthState();
  const authorizeUrl =
    value === "github"
      ? new URL("https://github.com/login/oauth/authorize")
      : new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizeUrl.searchParams.set("client_id", configuration.clientId);
  authorizeUrl.searchParams.set("redirect_uri", configuration.callbackUrl);
  authorizeUrl.searchParams.set("state", state);
  if (value === "github") {
    authorizeUrl.searchParams.set("scope", "read:user public_repo");
  } else {
    authorizeUrl.searchParams.set(
      "scope",
      "openid profile w_member_social",
    );
    authorizeUrl.searchParams.set("response_type", "code");
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(getOAuthStateCookieName(value), state, {
    httpOnly: true,
    secure: configuration.baseUrl.startsWith("https://"),
    sameSite: "lax",
    path: `/api/auth/${value}/callback`,
    maxAge: 600,
  });
  return response;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { provider: value } = await params;
  if (!isOAuthProvider(value)) {
    return Response.json({ error: "Unknown OAuth provider." }, { status: 404 });
  }

  let baseUrl: string;
  try {
    baseUrl = getOAuthConfiguration(value).baseUrl;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth configuration is invalid.";
    return Response.json({ error: message }, { status: 503 });
  }

  const response = NextResponse.redirect(
    new URL(`/?auth=${value}-disconnected`, baseUrl),
  );
  clearOAuthCookies(response, value);
  return response;
}
