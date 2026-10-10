import { getOAuthSession } from "@/lib/provider-auth";

type GitHubOwnerResponse = {
  login: string;
  html_url: string;
  public_repos: number;
  type?: string;
};

type LatestRepository = {
  id: number;
  name: string;
  updatedAt: string;
};

type OwnerLookup =
  | {
      ok: true;
      owner: GitHubOwnerResponse;
      latestRepository: LatestRepository | null;
      latestRepositoryError?: string;
    }
  | { ok: false; status: number; error: string };

type LatestRepositoryResponse = {
  id: number;
  name: string;
  updated_at: string;
  private: boolean;
  owner: { login: string };
};

const githubHeaders = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("firstOwner" in body) ||
    typeof body.firstOwner !== "string" ||
    !("secondOwner" in body) ||
    typeof body.secondOwner !== "string"
  ) {
    return Response.json({ error: "Enter two GitHub owners to compare." }, { status: 400 });
  }

  const firstOwner = body.firstOwner.trim();
  const secondOwner = body.secondOwner.trim();
  if (!isValidOwner(firstOwner) || !isValidOwner(secondOwner)) {
    return Response.json(
      { error: "Enter valid GitHub usernames or organization names." },
      { status: 400 },
    );
  }
  if (firstOwner.toLowerCase() === secondOwner.toLowerCase()) {
    return Response.json(
      { error: "Choose two different GitHub owners for the battle." },
      { status: 400 },
    );
  }

  const session = await getOAuthSession();
  const headers = {
    ...githubHeaders,
    ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
  };

  const [firstResult, secondResult] = await Promise.all([
    getOwnerStats(firstOwner, headers),
    getOwnerStats(secondOwner, headers),
  ]);
  if (firstResult.ok === false) {
    return Response.json(
      { error: firstResult.error },
      { status: firstResult.status },
    );
  }
  if (secondResult.ok === false) {
    return Response.json(
      { error: secondResult.error },
      { status: secondResult.status },
    );
  }

  return Response.json({
    first: toOwnerStats(
      firstResult.owner,
      firstResult.latestRepository,
      firstResult.latestRepositoryError,
    ),
    second: toOwnerStats(
      secondResult.owner,
      secondResult.latestRepository,
      secondResult.latestRepositoryError,
    ),
  });
}

async function getOwnerStats(
  owner: string,
  headers: Record<string, string>,
): Promise<OwnerLookup> {
  let response: Response;
  try {
    response = await fetch(`https://api.github.com/users/${encodeURIComponent(owner)}`, {
      headers,
      cache: "no-store",
    });
  } catch (error) {
    console.error("GitHub owner lookup failed.", error);
    return {
      ok: false,
      status: 502,
      error: "GitHub could not load owner data. Try again shortly.",
    };
  }

  if (response.status === 404) {
    try {
      response = await fetch(`https://api.github.com/orgs/${encodeURIComponent(owner)}`, {
        headers,
        cache: "no-store",
      });
    } catch (error) {
      console.error("GitHub organization lookup failed.", error);
      return {
        ok: false,
        status: 502,
        error: "GitHub could not load owner data. Try again shortly.",
      };
    }
  }

  if (response.status === 404) {
    return {
      ok: false,
      status: 404,
      error: `GitHub owner “${owner}” was not found.`,
    };
  }
  if (!response.ok) {
    console.error("GitHub owner lookup returned an error.", response.status);
    return {
      ok: false,
      status: response.status === 403 ? 429 : 502,
      error:
        response.status === 403
          ? "GitHub rate limit reached. Connect GitHub or try again later."
          : "GitHub could not load owner data. Try again shortly.",
    };
  }

  let data: unknown;
  let isOrganization = false;
  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      status: 502,
      error: "GitHub returned invalid owner data.",
    };
  }
  if (!isGitHubOwnerResponse(data)) {
    const kind =
      typeof data === "object" && data !== null && "type" in data ? data.type : null;
    if (kind !== "Organization") {
      return {
        ok: false,
        status: 502,
        error: "GitHub returned invalid owner data.",
      };
    }

    let organizationResponse: Response;
    try {
      organizationResponse = await fetch(
        `https://api.github.com/orgs/${encodeURIComponent(owner)}`,
        { headers, cache: "no-store" },
      );
    } catch (error) {
      console.error("GitHub organization lookup failed.", error);
      return {
        ok: false,
        status: 502,
        error: "GitHub could not load owner data. Try again shortly.",
      };
    }
    if (!organizationResponse.ok) {
      return {
        ok: false,
        status: organizationResponse.status === 403 ? 429 : 502,
        error:
          organizationResponse.status === 403
            ? "GitHub rate limit reached. Connect GitHub or try again later."
            : "GitHub could not load organization data. Try again shortly.",
      };
    }
    try {
      data = await organizationResponse.json();
    } catch {
      return {
        ok: false,
        status: 502,
        error: "GitHub returned invalid organization data.",
      };
    }
    if (!isGitHubOwnerResponse(data)) {
      return {
        ok: false,
        status: 502,
        error: "GitHub returned invalid organization data.",
      };
    }
    isOrganization = true;
  }

  const latestRepositoryResult =
    data.public_repos > 0
      ? await getLatestRepository(
          data.login,
          isOrganization || data.type === "Organization",
          headers,
        )
      : { repository: null };

  return {
    ok: true,
    owner: {
      login: data.login,
      html_url: data.html_url,
      public_repos: data.public_repos,
    },
    latestRepository: latestRepositoryResult.repository,
    latestRepositoryError: latestRepositoryResult.error,
  };
}

function isValidOwner(owner: string): boolean {
  return (
    owner.length <= 39 &&
    /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(owner)
  );
}

function isGitHubOwnerResponse(value: unknown): value is GitHubOwnerResponse {
  if (typeof value !== "object" || value === null) return false;
  const owner = value as Record<string, unknown>;
  if (
    typeof owner.login !== "string" ||
    typeof owner.html_url !== "string" ||
    typeof owner.public_repos !== "number" ||
    !Number.isSafeInteger(owner.public_repos) ||
    owner.public_repos < 0
  ) {
    return false;
  }

  try {
    const url = new URL(owner.html_url);
    return url.protocol === "https:" && url.hostname === "github.com";
  } catch {
    return false;
  }
}

async function getLatestRepository(
  owner: string,
  isOrganization: boolean,
  headers: Record<string, string>,
): Promise<{ repository: LatestRepository | null; error?: string }> {
  let response: Response;
  const route = isOrganization ? "orgs" : "users";
  const repositoryType = isOrganization ? "public" : "owner";
  try {
    response = await fetch(
      `https://api.github.com/${route}/${encodeURIComponent(owner)}/repos?type=${repositoryType}&sort=updated&direction=desc&per_page=1`,
      { headers, cache: "no-store" },
    );
  } catch (error) {
    console.error("Latest GitHub repository lookup failed.", error);
    return {
      repository: null,
      error: "GitHub could not load the latest repository.",
    };
  }

  if (!response.ok) {
    console.error("Latest GitHub repository lookup returned an error.", response.status);
    return {
      repository: null,
      error:
        response.status === 403
          ? "GitHub rate limit reached."
          : "GitHub could not load the latest repository.",
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      repository: null,
      error: "GitHub returned invalid repository data.",
    };
  }

  if (!Array.isArray(data)) {
    return {
      repository: null,
      error: "GitHub returned invalid repository data.",
    };
  }
  if (data.length === 0) return { repository: null };

  const repository = data[0];
  if (!isLatestRepositoryResponse(repository, owner)) {
    return {
      repository: null,
      error: "GitHub returned invalid latest repository data.",
    };
  }

  return {
    repository: {
      id: repository.id,
      name: repository.name,
      updatedAt: repository.updated_at,
    },
  };
}

function isLatestRepositoryResponse(
  value: unknown,
  owner: string,
): value is LatestRepositoryResponse {
  if (typeof value !== "object" || value === null) return false;
  const repository = value as Record<string, unknown>;
  if (
    typeof repository.id !== "number" ||
    !Number.isSafeInteger(repository.id) ||
    typeof repository.name !== "string" ||
    typeof repository.updated_at !== "string" ||
    repository.private !== false ||
    typeof repository.owner !== "object" ||
    repository.owner === null
  ) {
    return false;
  }
  const repositoryOwner = repository.owner as Record<string, unknown>;
  return (
    typeof repositoryOwner.login === "string" &&
    repositoryOwner.login.toLowerCase() === owner.toLowerCase()
  );
}

function toOwnerStats(
  owner: GitHubOwnerResponse,
  latestRepository: LatestRepository | null,
  latestRepositoryError?: string,
) {
  return {
    owner: owner.login,
    url: owner.html_url,
    publicRepositories: owner.public_repos,
    latestRepository,
    latestRepositoryError,
  };
}
