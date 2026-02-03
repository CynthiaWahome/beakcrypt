import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ErrorNode = {
  errors?: string[];
  properties?: Record<string, ErrorNode>;
};

export const collectErrorMessages = (node: ErrorNode): string[] => {
  const messages: string[] = [];

  if (Array.isArray(node?.errors)) {
    messages.push(...node.errors);
  }
  if (node?.properties && typeof node.properties === "object") {
    Object.values(node.properties).forEach((childNode) => {
      messages.push(...collectErrorMessages(childNode));
    });
  }

  return messages;
};

/**
 * Validates and sanitizes a callback URL to prevent open redirect attacks.
 * Only allows same-origin relative paths (e.g., "/dashboard", "/auth/invite?token=abc").
 * Rejects absolute URLs, protocol-relative URLs, and other potentially malicious inputs.
 */
export function getSafeCallbackURL(url: string | undefined): string {
  const fallback = "/";

  if (!url) return fallback;

  if (!url.startsWith("/") || url.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.hostname !== "localhost") {
      return fallback;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? parts
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : name.slice(0, 2).toUpperCase();
}
