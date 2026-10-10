
import { z } from "zod";

// Data your frontend sends to Gemini
export const LinkedInInputSchema = z.object({
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

// Data Gemini must return
export const LinkedInDraftSchema = z.object({
  post: z.string().min(1),
  hashtags: z.array(z.string()),
  highlights: z.array(z.string()),
});

// Automatically generate TypeScript types
export type LinkedInInput = z.input<
  typeof LinkedInInputSchema
>;

export type LinkedInDraft = z.infer<
  typeof LinkedInDraftSchema
>;
