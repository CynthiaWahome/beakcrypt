"use server";

import { z } from "zod/v4";
import { api } from "@beakcrypt/convex";
import type { Response } from "~/types/response";
import { collectErrorMessages } from "~/lib/utils";
import { validateSlug } from "shared/reserved-slugs";
import { isFailure } from "@beakcrypt/shared";
import type { Doc, Id } from "@beakcrypt/convex/dataModel";
import { isAuthenticated, fetchAuthMutation } from "@beakcrypt/convex/auth";

const createOrganizationSchema = z.object({
  name: z.string().min(3).max(32),
  slug: z
    .string()
    .min(3)
    .max(32)
    .refine((slug) => validateSlug(slug).valid, {
      message: "Invalid slug format",
    })
    .transform((slug) => {
      return slug.toLowerCase();
    }),
});

export const createOrganization = async (
  _: Response<Doc<"organizations">, { name: string; slug: string }>,
  formData: FormData,
): Promise<Response<Doc<"organizations">, { name: string; slug: string }>> => {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return {
      timestamp: Date.now(),
      error: "You must be logged in to perform this action.",
      inputs: {
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
      },
    };
  }

  const name = formData.get("name");
  const slug = formData.get("slug");
  const validatedData = createOrganizationSchema.safeParse({ name, slug });

  if (!validatedData.success) {
    const messages = collectErrorMessages(z.treeifyError(validatedData.error));

    return {
      timestamp: Date.now(),
      error: messages.join(", "),
      inputs: {
        name: String(name ?? ""),
        slug: String(slug ?? ""),
      },
    };
  }

  const result = await fetchAuthMutation(api.organizations.create, {
    name: validatedData.data.name,
    slug: validatedData.data.slug,
  });

  if (isFailure(result)) {
    return {
      error: result.error,
      timestamp: Date.now(),
      inputs: {
        name: validatedData.data.name,
        slug: validatedData.data.slug,
      },
    };
  }

  return {
    timestamp: Date.now(),
    message: "Organization created successfully!",
    data: result.data,
    inputs: {
      name: validatedData.data.name,
      slug: validatedData.data.slug,
    },
  };
};

const inviteUserSchema = z.object({
  email: z.email(),
  orgName: z.string().min(1),
  orgId: z
    .string()
    .min(1)
    .transform((v) => v as Id<"organizations">),
  role: z.enum(["admin", "member"]),
});

export const inviteUser = async (
  _: Response<
    Doc<"invites">,
    { email: string; role: string; orgId: string; orgName: string }
  >,
  formData: FormData,
): Promise<
  Response<
    Doc<"invites">,
    { email: string; role: string; orgId: string; orgName: string }
  >
> => {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return {
      timestamp: Date.now(),
      error: "You must be logged in to perform this action.",
      inputs: {
        role: String(formData.get("role") ?? ""),
        orgId: String(formData.get("orgId") ?? ""),
        email: String(formData.get("email") ?? ""),
        orgName: String(formData.get("orgName") ?? ""),
      },
    };
  }

  const role = formData.get("role");
  const email = formData.get("email");
  const orgId = formData.get("orgId");
  const orgName = formData.get("orgName");

  const validatedData = inviteUserSchema.safeParse({
    email,
    role,
    orgId,
    orgName,
  });

  if (!validatedData.success) {
    const messages = collectErrorMessages(z.treeifyError(validatedData.error));

    return {
      timestamp: Date.now(),
      error: messages.join(", "),
      inputs: {
        role: String(role ?? ""),
        orgId: String(orgId ?? ""),
        email: String(email ?? ""),
        orgName: String(orgName ?? ""),
      },
    };
  }

  const result = await fetchAuthMutation(api.invites.create, {
    role: validatedData.data.role,
    email: validatedData.data.email,
    orgId: validatedData.data.orgId,
  });

  if (isFailure(result)) {
    return {
      error: result.error,
      timestamp: Date.now(),
      inputs: {
        role: validatedData.data.role,
        email: validatedData.data.email,
        orgId: validatedData.data.orgId,
        orgName: validatedData.data.orgName,
      },
    };
  }

  return {
    timestamp: Date.now(),
    message: "Invite sent successfully!",
    data: result.data,
    inputs: {
      role: validatedData.data.role,
      email: validatedData.data.email,
      orgId: validatedData.data.orgId,
      orgName: validatedData.data.orgName,
    },
  };
};
