
import { z } from "zod";

// Data your frontend sends to Gemini
export const LinkedInInputSchema = z.object({
  projectName: z.string().min(1).max(150),
  commits: z.array(z.string()).min(1).max(30),
  readme: z.string().max(12000).default(""),
  tone: z.enum([
    "professional",
    "casual",
    "enthusiastic",
  ]).default("professional"),
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

