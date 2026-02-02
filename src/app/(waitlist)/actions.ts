"use server";

import { z } from "zod/v4";
import { api } from "conv/_generated/api";
import type { Response } from "~/types/response";
import { collectErrorMessages } from "~/lib/utils";
import { fetchMutation, fetchQuery } from "convex/nextjs";

const emailSchema = z.email("Please enter a valid email address");

export const joinWaitlist = async (
  _: Response<string, { email: string }>,
  formData: FormData,
): Promise<Response<string, { email: string }>> => {
  const email = formData.get("email");
  const validatedEmail = emailSchema.safeParse(email);

  if (!validatedEmail.success) {
    const messages = collectErrorMessages(z.treeifyError(validatedEmail.error));

    return {
      error: messages.join(", "),
      timestamp: Date.now(),
      inputs: {
        email: String(email ?? ""),
      },
    };
  }
  try {
    const existing = await fetchQuery(api.waitlists.getByEmail, {
      email: validatedEmail.data,
    });

    if (existing) {
      return {
        error: "You're already in the vault!",
        timestamp: Date.now(),
        inputs: {
          email: validatedEmail.data,
        },
      };
    }

    await fetchMutation(api.waitlists.add, {
      email: validatedEmail.data,
    });

    return {
      timestamp: Date.now(),
      message: "You've been added to the vault!",
      data: validatedEmail.data,
      inputs: {
        email: validatedEmail.data,
      },
    };
  } catch {
    return {
      error: "Oops, vault is currently unavailable.",
      timestamp: Date.now(),
      inputs: {
        email: validatedEmail.data,
      },
    };
  }
};
