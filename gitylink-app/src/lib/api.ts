
export async function generateLinkedInPost() {
  const response = await fetch("/api/generate-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectName: "AI Study Planner",
      commits: [
        "Implemented JWT authentication",
        "Added PostgreSQL task storage",
      ],
      readme: "A full-stack study planner.",
      tone: "professional",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate post");
  }

  return response.json();
}

export async function analyzeJob() {
  const response = await fetch("/api/analyze-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skills: ["React", "TypeScript"],
      projectEvidence:
        "Built a React dashboard using TypeScript.",
      jobDescription:
        "We need a frontend developer with React, " +
        "TypeScript, Docker and AWS experience.",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze job");
  }

  return response.json();
}

