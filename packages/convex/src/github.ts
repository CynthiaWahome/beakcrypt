import { v } from "convex/values";
import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { Result, success, failure, HttpStatus } from "@beakcrypt/shared";

type GitHubRepo = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatar: string;
  url: string;
  isPrivate: boolean;
  updatedAt: string;
  defaultBranch: string;
};

type GitHubApiRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  html_url: string;
  private: boolean;
  updated_at: string;
  default_branch: string;
};

function mapRepo(repo: GitHubApiRepo): GitHubRepo {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    ownerAvatar: repo.owner.avatar_url,
    url: repo.html_url,
    isPrivate: repo.private,
    updatedAt: repo.updated_at,
    defaultBranch: repo.default_branch,
  };
}

export const listRepos = action({
  args: {
    page: v.optional(v.number()),
    perPage: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Result<GitHubRepo[]>> => {
    const page = args.page ?? 1;
    const perPage = args.perPage ?? 5;

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return failure(
        HttpStatus.UNAUTHORIZED,
        "auth:not_authenticated",
        "Not authenticated",
      );
    }

    const account = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "account",
      where: [
        { field: "userId", value: identity.subject, operator: "eq" },
        {
          field: "providerId",
          value: "github",
          operator: "eq",
          connector: "AND",
        },
      ],
    });

    if (!account || !account.accessToken) {
      return failure(
        HttpStatus.FORBIDDEN,
        "github:not_connected",
        "GitHub not connected. Please grant repository access.",
      );
    }

    const accessToken = account.accessToken;

    const response = await fetch(
      `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=updated&affiliation=owner,collaborator,organization_member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return failure(
        HttpStatus.BAD_GATEWAY,
        "github:fetch_failed",
        `Failed to fetch repos: ${error}`,
      );
    }

    const repos: GitHubApiRepo[] = await response.json();

    return success(repos.map(mapRepo));
  },
});

export const searchRepos = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<Result<GitHubRepo[]>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return failure(
        HttpStatus.UNAUTHORIZED,
        "auth:not_authenticated",
        "Not authenticated",
      );
    }
    const account = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "account",
      where: [
        { field: "userId", value: identity.subject, operator: "eq" },
        {
          field: "providerId",
          value: "github",
          operator: "eq",
          connector: "AND",
        },
      ],
    });

    if (!account || !account.accessToken) {
      return failure(
        HttpStatus.FORBIDDEN,
        "github:not_connected",
        "GitHub not connected. Please log out and log back in to grant repository access.",
      );
    }

    const accessToken = account.accessToken;

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(args.query)}+in:name+user:@me&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return failure(
        HttpStatus.BAD_GATEWAY,
        "github:search_failed",
        `Failed to search repos: ${error}`,
      );
    }

    const data: { items: GitHubApiRepo[] } = await response.json();

    return success(data.items.map(mapRepo));
  },
});
