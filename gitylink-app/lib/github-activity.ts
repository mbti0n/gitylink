import { getGitHubProfile } from "@/lib/github-profile";
import { getGitHubRepositories } from "@/lib/github-repositories";
import { getOAuthSession } from "@/lib/provider-auth";

export type GitHubCommit = {
  sha: string;
  repo: string;
  url: string;
  date: string;
  message: string;
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

export async function getGitHubRepositoryCommits(
  repositoryName: string,
  limit = 30,
): Promise<GitHubCommit[] | null> {
  const token = (await getOAuthSession("github"))?.accessToken;
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
