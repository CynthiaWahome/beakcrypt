"use server";

import { z } from "zod/v4";
import { api } from "conv/_generated/api";
import type { Response } from "~/types/response";
import { collectErrorMessages } from "~/lib/utils";
import { isFailure } from "conv/types";
import type { Doc, Id } from "conv/_generated/dataModel";
import { isAuthenticated, fetchAuthMutation } from "~/lib/auth-server";

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(64, "Project name must be 64 characters or less")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Use lowercase letters, numbers, and hyphens only",
    )
    .transform((name) => name.toLowerCase()),
  orgId: z
    .string()
    .min(1)
    .transform((v) => v as Id<"organizations">),
  githubRepoId: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), {
      message: "Invalid GitHub repository ID",
    })
    .transform((v) => (v ? Number(v) : undefined)),
  githubRepoUrl: z.string().optional(),
  githubRepoName: z.string().optional(),
});

type CreateProjectInputs = {
  name: string;
  orgId: string;
  githubRepoId: string;
  githubRepoUrl: string;
  githubRepoName: string;
};

export const createProject = async (
  _: Response<Doc<"projects">, CreateProjectInputs>,
  formData: FormData,
): Promise<Response<Doc<"projects">, CreateProjectInputs>> => {
  const inputs: CreateProjectInputs = {
    name: String(formData.get("name") ?? ""),
    orgId: String(formData.get("orgId") ?? ""),
    githubRepoId: String(formData.get("githubRepoId") ?? ""),
    githubRepoUrl: String(formData.get("githubRepoUrl") ?? ""),
    githubRepoName: String(formData.get("githubRepoName") ?? ""),
  };

  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return {
      timestamp: Date.now(),
      error: "You must be logged in to perform this action.",
      inputs,
    };
  }

  const validated = createProjectSchema.safeParse({
    name: inputs.name,
    orgId: inputs.orgId,
    githubRepoId: inputs.githubRepoId || undefined,
    githubRepoUrl: inputs.githubRepoUrl || undefined,
    githubRepoName: inputs.githubRepoName || undefined,
  });

  if (!validated.success) {
    const messages = collectErrorMessages(z.treeifyError(validated.error));
    return {
      timestamp: Date.now(),
      error: messages.join(", "),
      inputs,
    };
  }

  const result = await fetchAuthMutation(api.projects.create, {
    name: validated.data.name,
    orgId: validated.data.orgId,
    githubRepoId: validated.data.githubRepoId,
    githubRepoUrl: validated.data.githubRepoUrl,
    githubRepoName: validated.data.githubRepoName,
  });

  if (isFailure(result)) {
    return {
      error: result.error,
      timestamp: Date.now(),
      inputs,
    };
  }

  return {
    timestamp: Date.now(),
    message: "Project created successfully!",
    data: result.data,
    inputs,
  };
};
