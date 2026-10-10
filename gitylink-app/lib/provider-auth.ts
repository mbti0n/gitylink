import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { io } from "next/cache";
import { cookies } from "next/headers";

export type OAuthSession = {
  accessToken: string;
  expiresAt: number;
  username?: string;
  displayName?: string;
};

export type OAuthConfiguration = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  callbackUrl: string;
};

const sessionCookieName = "gitylink_github_session";
const stateCookieName = "gitylink_github_oauth_state";

export function getOAuthConfiguration(): OAuthConfiguration {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const configuredBaseUrl = process.env.AUTH_BASE_URL;
  const authSecret = process.env.AUTH_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth requires its client ID and client secret.");
  }
  if (!configuredBaseUrl) {
    throw new Error("AUTH_BASE_URL must be configured before OAuth can start.");
  }
  if (!authSecret || authSecret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  const base = new URL(configuredBaseUrl);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.pathname !== "/" ||
    base.search ||
    base.hash
  ) {
    throw new Error("AUTH_BASE_URL must be an HTTP(S) origin without a path.");
  }

  const baseUrl = base.origin;
  return {
    clientId,
    clientSecret,
    baseUrl,
    callbackUrl: `${baseUrl}/api/auth/github/callback`,
  };
}

export function getOAuthStateCookieName() {
  return stateCookieName;
}

export function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

export async function getOAuthSession(): Promise<OAuthSession | null> {
  const value = (await cookies()).get(sessionCookieName)?.value;
  if (!value) return null;

  await io();
  try {
    const decoded = decryptSession(value);
    if (!isOAuthSession(decoded) || decoded.expiresAt <= Date.now()) {
      return null;
    }
    return decoded;
  } catch (error) {
    console.warn("Ignoring an invalid GitHub OAuth session cookie.", error);
    return null;
  }
}

export function setOAuthSessionCookie(response: Response, session: OAuthSession) {
  const { baseUrl } = getOAuthConfiguration();
  const maxAge = Math.max(
    0,
    Math.floor((session.expiresAt - Date.now()) / 1000),
  );
  response.headers.append(
    "Set-Cookie",
    serializeCookie(sessionCookieName, encryptSession(session), {
      httpOnly: true,
      secure: baseUrl.startsWith("https://"),
      sameSite: "Lax",
      path: "/",
      maxAge,
    }),
  );
}

export function clearOAuthCookies(response: Response) {
  const secure = process.env.AUTH_BASE_URL?.startsWith("https://") ?? false;
  response.headers.append(
    "Set-Cookie",
    serializeCookie(sessionCookieName, "", {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
      maxAge: 0,
    }),
  );
  clearOAuthStateCookie(response);
}

export function clearOAuthStateCookie(response: Response) {
  const secure = process.env.AUTH_BASE_URL?.startsWith("https://") ?? false;
  response.headers.append(
    "Set-Cookie",
    serializeCookie(stateCookieName, "", {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/api/auth/github/callback",
      maxAge: 0,
    }),
  );
}

function encryptSession(session: OAuthSession) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), nonce);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString(
    "base64url",
  );
}

function decryptSession(value: string): OAuthSession | null {
  const data = Buffer.from(value, "base64url");
  if (data.length < 29) return null;

  const nonce = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), nonce);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
  const parsed: unknown = JSON.parse(plaintext);
  return isOAuthSession(parsed) ? parsed : null;
}

function isOAuthSession(value: unknown): value is OAuthSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.expiresAt === "number" &&
    Number.isFinite(session.expiresAt) &&
    (session.username === undefined || typeof session.username === "string") &&
    (session.displayName === undefined || typeof session.displayName === "string")
  );
}

function getEncryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return createHash("sha256").update(secret).digest();
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Lax";
    path: string;
    maxAge: number;
  },
) {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite}`,
  ];
  if (options.httpOnly) attributes.push("HttpOnly");
  if (options.secure) attributes.push("Secure");
  return attributes.join("; ");
}
