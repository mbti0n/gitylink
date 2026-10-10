import { getGitHubProfile } from "@/lib/github-profile";
import { getGitHubRepositories } from "@/lib/github-repositories";
import type {
  RepositoryComparison,
  RepositoryComparisonResponse,
} from "@/lib/repository-comparison";
import { getOAuthSession } from "@/lib/provider-auth";

type GitHubRepositoryResponse = {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
};

const githubHeaders = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

type PublicRepositorySelector = {
  owner: string;
  name: string;
};

export async function POST(request: Request) {
  const session = await getOAuthSession();
  if (!session) {
    return Response.json({ error: "Connect GitHub to compare repositories." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("mode" in body)) {
    return Response.json({ error: "Choose a comparison type." }, { status: 400 });
  }

  const [repositories, profile] = await Promise.all([
    getGitHubRepositories(),
    getGitHubProfile(),
  ]);
  if (repositories === null || !profile) {
    return Response.json(
      { error: "Could not load your GitHub repositories. Try reconnecting GitHub." },
      { status: 503 },
    );
  }

  let first: RepositoryComparison;
  let second: RepositoryComparison;

  if (body.mode === "owned") {
    if (
      !("firstId" in body) ||
      !("secondId" in body) ||
      typeof body.firstId !== "number" ||
      typeof body.secondId !== "number" ||
      !Number.isSafeInteger(body.firstId) ||
      !Number.isSafeInteger(body.secondId)
    ) {
      return Response.json({ error: "Choose two valid repositories." }, { status: 400 });
    }
    if (body.firstId === body.secondId) {
      return Response.json({ error: "Choose two different repositories." }, { status: 400 });
    }

    const firstRepository = repositories.find(({ id }) => id === body.firstId);
    const secondRepository = repositories.find(({ id }) => id === body.secondId);
    if (!firstRepository || !secondRepository) {
      return Response.json(
        { error: "Both repositories must be public repositories on your account." },
        { status: 404 },
      );
    }

    const [firstLanguages, secondLanguages] = await Promise.all([
      getLanguageBreakdown(profile.login, firstRepository.name, session.accessToken),
      getLanguageBreakdown(profile.login, secondRepository.name, session.accessToken),
    ]);
    if (!firstLanguages || !secondLanguages) {
      return Response.json(
        { error: "GitHub could not load language data for one of these repositories." },
        { status: 502 },
      );
    }

    first = toComparison(firstRepository, profile.login, firstLanguages);
    second = toComparison(secondRepository, profile.login, secondLanguages);
  } else if (body.mode === "public") {
    const firstSelector = "first" in body ? parsePublicRepositorySelector(body.first) : null;
    const secondSelector = "second" in body ? parsePublicRepositorySelector(body.second) : null;
    if (!firstSelector || !secondSelector) {
      return Response.json(
        { error: "Enter an owner and repository name for both public GitHub repositories." },
        { status: 400 },
      );
    }
    if (firstSelector.owner.toLowerCase() === secondSelector.owner.toLowerCase()) {
      return Response.json(
        { error: "Choose repositories belonging to two different GitHub owners." },
        { status: 400 },
      );
    }

    const headers = {
      ...githubHeaders,
      Authorization: `Bearer ${session.accessToken}`,
    };
    let firstRepositoryResponse: Response;
    let secondRepositoryResponse: Response;
    try {
      [firstRepositoryResponse, secondRepositoryResponse] = await Promise.all([
        fetch(getRepositoryUrl(firstSelector), { headers, cache: "no-store" }),
        fetch(getRepositoryUrl(secondSelector), { headers, cache: "no-store" }),
      ]);
    } catch (error) {
      console.error("GitHub repository comparison request failed.", error);
      return Response.json(
        { error: "GitHub could not load the repository comparison. Try again shortly." },
        { status: 502 },
      );
    }
    if (firstRepositoryResponse.status === 404 || secondRepositoryResponse.status === 404) {
      return Response.json(
        { error: "One or both public GitHub repositories could not be found." },
        { status: 404 },
      );
    }
    if (!firstRepositoryResponse.ok || !secondRepositoryResponse.ok) {
      return Response.json(
        { error: "GitHub could not load the repository comparison. Try again shortly." },
        { status: 502 },
      );
    }

    let firstRepositoryData: unknown;
    let secondRepositoryData: unknown;
    try {
      [firstRepositoryData, secondRepositoryData] = await Promise.all([
        firstRepositoryResponse.json(),
        secondRepositoryResponse.json(),
      ]);
    } catch {
      return Response.json(
        { error: "GitHub returned invalid repository data." },
        { status: 502 },
      );
    }
    if (
      !isGitHubRepositoryResponse(firstRepositoryData) ||
      !isGitHubRepositoryResponse(secondRepositoryData)
    ) {
      return Response.json(
        { error: "GitHub returned invalid repository data." },
        { status: 502 },
      );
    }
    if (firstRepositoryData.private || secondRepositoryData.private) {
      return Response.json(
        { error: "Only public GitHub repositories can be compared." },
        { status: 404 },
      );
    }

    let firstLanguages: Record<string, number> | null;
    let secondLanguages: Record<string, number> | null;
    try {
      [firstLanguages, secondLanguages] = await Promise.all([
        getLanguageBreakdown(
          firstSelector.owner,
          firstSelector.name,
          session.accessToken,
        ),
        getLanguageBreakdown(
          secondSelector.owner,
          secondSelector.name,
          session.accessToken,
        ),
      ]);
    } catch (error) {
      console.error("GitHub language comparison request failed.", error);
      return Response.json(
        { error: "GitHub could not load language data for these repositories." },
        { status: 502 },
      );
    }
    if (!firstLanguages || !secondLanguages) {
      return Response.json(
        { error: "GitHub could not load language data for one or both repositories." },
        { status: 502 },
      );
    }

    first = toPublicComparison(firstRepositoryData, firstLanguages);
    second = toPublicComparison(secondRepositoryData, secondLanguages);
  } else {
    return Response.json({ error: "Choose a supported comparison type." }, { status: 400 });
  }

  const result: RepositoryComparisonResponse = { first, second };
  return Response.json(result);
}

function parsePublicRepositorySelector(value: unknown): PublicRepositorySelector | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("owner" in value) ||
    typeof value.owner !== "string" ||
    !("name" in value) ||
    typeof value.name !== "string"
  ) {
    return null;
  }
  const owner = value.owner.trim();
  const name = value.name.trim();
  if (!isValidOwner(owner) || !isValidRepositoryName(name)) return null;
  return { owner, name };
}

function getRepositoryUrl(repository: PublicRepositorySelector): string {
  return `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
}

function toPublicComparison(
  repository: GitHubRepositoryResponse,
  languages: Record<string, number>,
): RepositoryComparison {
  return {
    fullName: repository.full_name,
    url: repository.html_url,
    description: repository.description,
    primaryLanguage: repository.language,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    updatedAt: repository.updated_at,
    languages,
  };
}

async function getLanguageBreakdown(
  owner: string,
  name: string,
  accessToken: string,
): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/languages`,
      {
        headers: {
          ...githubHeaders,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;

    const languages: unknown = await response.json();
    if (
      typeof languages !== "object" ||
      languages === null ||
      Array.isArray(languages) ||
      !Object.values(languages).every(
        (value) => typeof value === "number" && Number.isFinite(value) && value >= 0,
      )
    ) {
      return null;
    }
    return languages as Record<string, number>;
  } catch {
    return null;
  }
}

function toComparison(
  repository: {
    name: string;
    url: string;
    description: string | null;
    language: string | null;
    updatedAt: string;
    stars: number;
    forks: number;
  },
  owner: string,
  languages: Record<string, number>,
): RepositoryComparison {
  return {
    fullName: `${owner}/${repository.name}`,
    url: repository.url,
    description: repository.description,
    primaryLanguage: repository.language,
    stars: repository.stars,
    forks: repository.forks,
    updatedAt: repository.updatedAt,
    languages,
  };
}

function isValidOwner(owner: string): boolean {
  return owner.length <= 39 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(owner);
}

function isValidRepositoryName(name: string): boolean {
  return name.length <= 100 && /^[A-Za-z0-9_.-]+$/.test(name);
}

function isGitHubRepositoryResponse(
  repository: unknown,
): repository is GitHubRepositoryResponse {
  if (typeof repository !== "object" || repository === null) return false;
  const data = repository as Record<string, unknown>;
  return (
    typeof data.full_name === "string" &&
    typeof data.html_url === "string" &&
    isGitHubUrl(data.html_url) &&
    (typeof data.description === "string" || data.description === null) &&
    (typeof data.language === "string" || data.language === null) &&
    typeof data.stargazers_count === "number" &&
    Number.isSafeInteger(data.stargazers_count) &&
    data.stargazers_count >= 0 &&
    typeof data.forks_count === "number" &&
    Number.isSafeInteger(data.forks_count) &&
    data.forks_count >= 0 &&
    typeof data.updated_at === "string" &&
    Number.isFinite(Date.parse(data.updated_at)) &&
    typeof data.private === "boolean"
  );
}

function isGitHubUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com";
  } catch {
    return false;
  }
}
