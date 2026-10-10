import { cache } from "react";
import { getGitHubProfile } from "@/lib/github-profile";
import { getGitHubRepositories } from "@/lib/github-repositories";

export type GitHubCommit = {
  sha: string;
  repo: string;
  url: string;
  date: string;
  message: string;
};

type GitHubRepositoryResponse = {
  name: string;
  owner: { login: string };
  fork: boolean;
  private: boolean;
};

type GitHubCommitResponse = {
  sha: string;
  html_url: string;
  commit: {
    author: { date: string } | null;
    message: string;
  };
};

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export const getGitHubActivity = cache(async (limit: number): Promise<GitHubCommit[] | null> => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const headers = { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` };

  try {
    const [userResponse, repositoriesResponse] = await Promise.all([
      fetch("https://api.github.com/user", { headers, cache: "no-store" }),
      fetch(
        "https://api.github.com/user/repos?visibility=public&affiliation=owner&sort=updated&direction=desc&per_page=100",
        { headers, cache: "no-store" },
      ),
    ]);

    if (!userResponse.ok || !repositoriesResponse.ok) return null;

    const user = (await userResponse.json()) as { login: string };
    const repositories = (await repositoriesResponse.json()) as GitHubRepositoryResponse[];
    const ownedRepositories = repositories.filter((repository) => !repository.private && !repository.fork);

    const commitPages = await Promise.all(
      ownedRepositories.map(async (repository) => {
        const response = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(repository.owner.login)}/${encodeURIComponent(repository.name)}/commits?author=${encodeURIComponent(user.login)}&per_page=${limit}`,
          { headers, cache: "no-store" },
        );
        if (!response.ok) return [];

        const commits = (await response.json()) as GitHubCommitResponse[];
        return commits.flatMap((commit) =>
          commit.commit.author
            ? [{
                sha: commit.sha,
                repo: repository.name,
                url: commit.html_url,
                date: commit.commit.author.date,
                message: commit.commit.message.split("\n", 1)[0],
              }]
            : [],
        );
      }),
    );

    return commitPages
      .flat()
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .filter((commit, index, all) => all.findIndex((candidate) => candidate.sha === commit.sha) === index)
      .slice(0, limit);
  } catch {
    return null;
  }
});

export async function getGitHubRepositoryCommits(
  repositoryName: string,
  limit = 30,
): Promise<GitHubCommit[] | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const [profile, repositories] = await Promise.all([
    getGitHubProfile(),
    getGitHubRepositories(),
  ]);
  const repository = repositories?.find((item) => item.name === repositoryName);
  if (!profile || !repository) return null;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(profile.login)}/${encodeURIComponent(repository.name)}/commits?author=${encodeURIComponent(profile.login)}&per_page=${limit}`,
      {
        headers: { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;

    const commits = (await response.json()) as GitHubCommitResponse[];
    return commits.flatMap((commit) =>
      commit.commit.author
        ? [{
            sha: commit.sha,
            repo: repository.name,
            url: commit.html_url,
            date: commit.commit.author.date,
            message: commit.commit.message.split("\n", 1)[0],
          }]
        : [],
    );
  } catch {
    return null;
  }
}
