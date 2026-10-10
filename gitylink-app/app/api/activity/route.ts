import { getGitHubActivity } from "@/lib/github-activity";

export async function GET() {
  const commits = await getGitHubActivity(50);
  if (!commits) {
    return Response.json({ error: "GitHub activity is unavailable." }, { status: 503 });
  }

  return Response.json({ commits });
}
