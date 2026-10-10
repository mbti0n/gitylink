import { z } from "zod";

export const ProjectDraftInputSchema = z.object({
  projectName: z.string().min(1).max(150),
  commits: z.array(z.string()).min(1).max(30),
  readme: z.string().max(12000).default(""),
  tone: z.enum([
    "authentic_reflective",
    "professional",
    "casual",
    "enthusiastic",
  ]).default("professional"),
  action: z.enum(["generate", "rewrite", "shorten", "new_hook"]).default("generate"),
  draft: z.string().max(5000).optional(),
});

export const ProjectDraftSchema = z.object({
  draft: z.string().min(1),
});

export type ProjectDraftInput = z.input<typeof ProjectDraftInputSchema>;
export type ProjectDraft = z.infer<typeof ProjectDraftSchema>;
