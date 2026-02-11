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
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?!";
  }

  return parts.length > 1
    ? parts
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : trimmed.slice(0, 2).toUpperCase();
}
