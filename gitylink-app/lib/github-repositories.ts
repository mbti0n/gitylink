import { cache } from "react";
import { getOAuthSession } from "@/lib/provider-auth";

export type GitHubRepository = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
  stars: number;
  forks: number;
};

type GitHubRepositoryResponse = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  fork: boolean;
};

export const getGitHubRepositories = cache(
  async (): Promise<GitHubRepository[] | null> => {
    const token = (await getOAuthSession("github"))?.accessToken;
    if (!token) return null;

    const repositories: GitHubRepository[] = [];

    try {
      for (let page = 1; ; page += 1) {
        const response = await fetch(
          `https://api.github.com/user/repos?visibility=public&affiliation=owner&sort=updated&direction=desc&per_page=100&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) return null;

        const pageRepositories = (await response.json()) as GitHubRepositoryResponse[];
        repositories.push(
          ...pageRepositories
            .filter((repository) => !repository.private && !repository.fork)
            .map((repository) => ({
              id: repository.id,
              name: repository.name,
              url: repository.html_url,
              description: repository.description,
              language: repository.language,
              updatedAt: repository.updated_at,
              stars: repository.stargazers_count,
              forks: repository.forks_count,
            })),
        );

        if (pageRepositories.length < 100) break;
      }

      return repositories;
    } catch {
      return null;
    }
  },
);
