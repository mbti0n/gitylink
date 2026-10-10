import { getGitHubProfile } from "@/lib/github-profile";
import { getGitHubRepositories } from "@/lib/github-repositories";

export type RepositoryMediaSource = {
  owner: string;
  name: string;
  language: string | null;
  description: string | null;
  readme: string;
};

export type RepositoryMediaResolution =
  | { ok: true; repository: RepositoryMediaSource }
  | { ok: false; status: number; error: string };

type GitHubRepositoryResponse = {
  name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  private: boolean;
};

type GitHubReadmeResponse = {
  content?: string;
  encoding?: string;
};

const githubHeaders = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export async function resolveRepositoryMediaSource(
  body: unknown,
  accessToken: string,
): Promise<RepositoryMediaResolution> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, error: "Choose a valid repository album." };
  }

  let owner: string;
  let name: string;
  let language: string | null;
  let description: string | null;

  if ("repositoryId" in body) {
    if (typeof body.repositoryId !== "number" || !Number.isSafeInteger(body.repositoryId)) {
      return { ok: false, status: 400, error: "Choose a valid repository album." };
    }

    const [repositories, profile] = await Promise.all([
      getGitHubRepositories(),
      getGitHubProfile(),
    ]);
    if (!repositories || !profile) {
      return {
        ok: false,
        status: 503,
        error: "Could not load your GitHub repositories. Try reconnecting GitHub.",
      };
    }
    const repository = repositories.find((item) => item.id === body.repositoryId);
    if (!repository) {
      return {
        ok: false,
        status: 404,
        error: "That public repository could not be found on your account.",
      };
    }
    owner = profile.login;
    name = repository.name;
    language = repository.language;
    description = repository.description;
  } else {
    if (
      !("owner" in body) ||
      typeof body.owner !== "string" ||
      !("name" in body) ||
      typeof body.name !== "string"
    ) {
      return { ok: false, status: 400, error: "Choose a valid repository album." };
    }
    owner = body.owner.trim();
    name = body.name.trim();
    if (!isValidOwner(owner) || !isValidRepositoryName(name)) {
      return {
        ok: false,
        status: 400,
        error: "Enter a GitHub owner and repository name, not a full URL.",
      };
    }

    let response: Response;
    try {
      response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
        {
          headers: { ...githubHeaders, Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        },
      );
    } catch (error) {
      console.error("GitHub repository lookup for media generation failed.", error);
      return {
        ok: false,
        status: 502,
        error: "GitHub could not load that repository. Try again shortly.",
      };
    }

    if (response.status === 404) {
      return { ok: false, status: 404, error: "That public GitHub repository was not found." };
    }
    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        error: "GitHub could not load that repository. Try again shortly.",
      };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { ok: false, status: 502, error: "GitHub returned invalid repository data." };
    }
    if (!isGitHubRepositoryResponse(data)) {
      return { ok: false, status: 502, error: "GitHub returned invalid repository data." };
    }
    if (data.private) {
      return { ok: false, status: 404, error: "Only public repositories can be used here." };
    }
    owner = data.owner.login;
    name = data.name;
    language = data.language;
    description = data.description;
  }

  let readme = "";
  let readmeResponse: Response;
  try {
    readmeResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/readme`,
      {
        headers: { ...githubHeaders, Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error("GitHub README lookup for media generation failed.", error);
    return {
      ok: false,
      status: 502,
      error: "GitHub could not load this repository’s overview. Try again shortly.",
    };
  }

  if (readmeResponse.ok) {
    try {
      const readmeData = (await readmeResponse.json()) as GitHubReadmeResponse;
      if (readmeData.content && readmeData.encoding === "base64") {
        readme = Buffer.from(readmeData.content, "base64").toString("utf8").slice(0, 8000);
      }
    } catch (error) {
      console.error("GitHub returned an unreadable README for media generation.", error);
      return {
        ok: false,
        status: 502,
        error: "GitHub returned an unreadable repository overview.",
      };
    }
  } else if (readmeResponse.status !== 404) {
    return {
      ok: false,
      status: 502,
      error: "Could not read this repository’s overview from GitHub.",
    };
  }

  return { ok: true, repository: { owner, name, language, description, readme } };
}

function isGitHubRepositoryResponse(value: unknown): value is GitHubRepositoryResponse {
  if (typeof value !== "object" || value === null) return false;
  const repository = value as Record<string, unknown>;
  return (
    typeof repository.name === "string" &&
    typeof repository.owner === "object" &&
    repository.owner !== null &&
    typeof (repository.owner as Record<string, unknown>).login === "string" &&
    (repository.description === null || typeof repository.description === "string") &&
    (repository.language === null || typeof repository.language === "string") &&
    typeof repository.private === "boolean"
  );
}

function isValidOwner(value: string): boolean {
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(value);
}

function isValidRepositoryName(value: string): boolean {
  return value.length > 0 && value.length <= 100 && /^[A-Za-z0-9._-]+$/.test(value);
}
