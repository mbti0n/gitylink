
import { z } from "zod";

// Input from frontend
export const JobInputSchema = z.object({
  skills: z.array(z.string()).max(100),
  projectEvidence: z.string().max(12000),
  jobDescription: z.string().min(30).max(15000),
});

// Expected Gemini response
export const JobAnalysisSchema = z.object({
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),

  recommendations: z.array(
    z.object({
      skill: z.string(),
      project: z.string(),
      description: z.string(),
    })
  ),

  summary: z.string(),
});

export type JobInput = z.infer<
  typeof JobInputSchema
>;

export type JobAnalysis = z.infer<
  typeof JobAnalysisSchema
>;

