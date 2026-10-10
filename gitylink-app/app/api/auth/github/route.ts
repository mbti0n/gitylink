import { NextResponse } from "next/server";
import {
  clearOAuthCookies,
  createOAuthState,
  getOAuthConfiguration,
  getOAuthStateCookieName,
} from "@/lib/provider-auth";

export async function GET() {
  let configuration;
  try {
    configuration = getOAuthConfiguration();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth configuration is invalid.";
    return Response.json({ error: message }, { status: 503 });
  }

  const state = createOAuthState();
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", configuration.clientId);
  authorizeUrl.searchParams.set("redirect_uri", configuration.callbackUrl);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", "read:user public_repo");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(getOAuthStateCookieName(), state, {
    httpOnly: true,
    secure: configuration.baseUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth/github/callback",
    maxAge: 600,
  });
  return response;
}

export async function POST() {
  let baseUrl: string;
  try {
    baseUrl = getOAuthConfiguration().baseUrl;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth configuration is invalid.";
    return Response.json({ error: message }, { status: 503 });
  }

  const response = NextResponse.redirect(
    new URL("/?auth=github-disconnected", baseUrl),
  );
  clearOAuthCookies(response);
  return response;
}
