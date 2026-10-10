import { getGitHubRepositoryCommits } from "@/lib/github-activity";

export async function GET(request: Request) {
  const repository = new URL(request.url).searchParams.get("repo")?.trim();
  if (!repository || repository.length > 100) {
    return Response.json({ error: "Choose a valid repository." }, { status: 400 });
  }

  const commits = await getGitHubRepositoryCommits(repository);
  if (!commits) {
    return Response.json({ error: "Could not load commits for this repository." }, { status: 404 });
  }

  return Response.json({ commits });
}
