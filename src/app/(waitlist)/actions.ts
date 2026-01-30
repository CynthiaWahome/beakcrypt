"use server";

import { z } from "zod/v4";
import { api } from "conv/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";

const emailSchema = z.email("Please enter a valid email address");

export interface SuccessResponse {
  timestamp: number;
  message: string;
  inputs: {
    email: z.infer<typeof emailSchema>;
  };
}

export interface ErrorResponse {
  timestamp: number;
  error: string | string[];
  inputs: {
    email: z.infer<typeof emailSchema>;
  };
}

export type Response = SuccessResponse | ErrorResponse;

export const joinWaitlist = async (
  _: Response,
  formData: FormData,
): Promise<Response> => {
  const email = formData.get("email");
  const validatedEmail = emailSchema.safeParse(email);

  if (!validatedEmail.success) {
    return {
      error:
        validatedEmail.error.issues[0]?.message ??
        "Please enter a valid email address",
      timestamp: Date.now(),
      inputs: {
        email: String(email ?? ""),
      },
    };
  }
  try {
    const existing = await fetchQuery(api.waitlist.getByEmail, {
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

    await fetchMutation(api.waitlist.add, {
      email: validatedEmail.data,
      createdAt: Date.now(),
    });

    return {
      timestamp: Date.now(),
      message: "You've been added to the vault!",
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
