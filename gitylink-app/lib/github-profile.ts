import { cache } from "react";
import { getOAuthSession } from "@/lib/provider-auth";

export type GitHubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  profileUrl: string;
};

type GitHubUserResponse = {
  login: string;
  name: string | null;
  bio: string | null;
  html_url: string;
};

export const getGitHubProfile = cache(async (): Promise<GitHubProfile | null> => {
  const token = (await getOAuthSession("github"))?.accessToken;
  if (!token) return null;

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const user = (await response.json()) as GitHubUserResponse;
    return {
      login: user.login,
      name: user.name,
      bio: user.bio,
      profileUrl: user.html_url,
    };
  } catch {
    return null;
  }
});

export function getGitHubInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
