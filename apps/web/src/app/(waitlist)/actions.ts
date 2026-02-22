"use server";

import { z } from "zod/v4";
import { api } from "@beakcrypt/convex";
import type { Response } from "~/types/response";
import { collectErrorMessages } from "~/lib/utils";
import { fetchMutation } from "convex/nextjs";
import { isFailure } from "@beakcrypt/shared";

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

  const result = await fetchMutation(api.waitlists.add, {
    email: validatedEmail.data,
  });

  if (isFailure(result)) {
    return {
      error: result.error,
      timestamp: Date.now(),
      inputs: {
        email: validatedEmail.data,
      },
    };
  }

  return {
    timestamp: Date.now(),
    message: "You've been added to the vault!",
    data: validatedEmail.data,
    inputs: {
      email: validatedEmail.data,
    },
  };
};
