"use client";

import { useQuery } from "@tanstack/react-query";
import { githubApi } from "./api";
import { tokenManager } from "@/utils/fetcher";

export const githubKeys = {
  all: ["github"] as const,
  connection: () => [...githubKeys.all, "connection"] as const,
  repositories: () => [...githubKeys.all, "repositories"] as const,
  branches: (owner: string, repo: string) =>
    [...githubKeys.all, "branches", owner, repo] as const,
  parsedEndpoints: (repoId: number) =>
    [...githubKeys.all, "parsed-endpoints", repoId] as const,
};

export function useGitHubConnectionQuery() {
  return useQuery({
    queryKey: githubKeys.connection(),
    queryFn: () => githubApi.getConnection(),
    enabled: !!tokenManager.getAccessToken(),
    retry: false,
    staleTime: 30_000,
  });
}

export function useAvailableRepositoriesQuery(enabled = true) {
  return useQuery({
    queryKey: githubKeys.repositories(),
    queryFn: () => githubApi.getAvailableRepositories(),
    enabled: enabled && !!tokenManager.getAccessToken(),
    retry: false,
    staleTime: 30_000,
  });
}

export function useParsedEndpointsQuery(
  githubRepoId: number | null,
  repoFullName: string,
  branch: string,
  enabled = true
) {
  return useQuery({
    queryKey: [...githubKeys.parsedEndpoints(githubRepoId ?? -1), repoFullName, branch],
    queryFn: () => githubApi.getParsedEndpoints(githubRepoId!, repoFullName, branch),
    enabled:
      enabled &&
      githubRepoId != null &&
      !!repoFullName &&
      !!branch &&
      !!tokenManager.getAccessToken(),
    retry: false,
    staleTime: 60_000,
  });
}

export function useBranchesQuery(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  return useQuery({
    queryKey: githubKeys.branches(owner ?? "", repo ?? ""),
    queryFn: () => githubApi.getBranches(owner!, repo!),
    enabled: !!repoFullName && repoFullName.includes("/"),
    retry: false,
    staleTime: 60_000,
  });
}
