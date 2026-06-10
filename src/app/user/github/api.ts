import { fetchClient } from "@/utils/fetcher";

export interface GitHubConnectionResponse {
  githubLogin: string;
  installationId: number | null;
  appInstalled: boolean;
}

export interface GitHubConnectResponse {
  githubLogin: string;
  installUrl: string;
  accessToken: string;
}

export interface GitHubRepoItem {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
}

export interface GitHubBranchItem {
  name: string;
  protected: boolean;
}

export interface GitHubParsedEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;
  endpoint: string;
}

export interface RegisteredRepoResponse {
  id: number;
  repoFullName: string;
  branch: string;
  repositoryUrl: string;
}

type ApiResponse<T> = {
  message: string;
  data: T;
};

export const githubApi = {
  getAuthorizeUrl: async (): Promise<string> => {
    const res = await fetchClient.get<ApiResponse<Record<string, string>>>(
      "/github/authorize-url"
    );
    return res.data.url ?? Object.values(res.data)[0] ?? "";
  },

  connect: async (code: string): Promise<GitHubConnectResponse> => {
    const res = await fetchClient.post<ApiResponse<GitHubConnectResponse>>(
      "/github/connect",
      { code }
    );
    return res.data;
  },

  // 404 = 미연동 → null 반환
  getConnection: async (): Promise<GitHubConnectionResponse | null> => {
    try {
      const res = await fetchClient.get<ApiResponse<GitHubConnectionResponse>>(
        "/github/connection"
      );
      return res.data;
    } catch {
      return null;
    }
  },

  // GitHub App이 설치된 레포지토리 목록 (GitHub 실시간 조회)
  getAvailableRepositories: async (): Promise<GitHubRepoItem[]> => {
    const res = await fetchClient.get<ApiResponse<GitHubRepoItem[]>>(
      "/github/repositories/available"
    );
    return res.data ?? [];
  },

  getBranches: async (owner: string, repo: string): Promise<GitHubBranchItem[]> => {
    const res = await fetchClient.get<ApiResponse<GitHubBranchItem[]>>(
      `/github/repositories/${owner}/${repo}/branches`
    );
    return res.data ?? [];
  },

  // 레포에서 AST 파싱된 엔드포인트 목록
  // githubRepoId(available 응답의 id) + repoFullName/branch 쿼리로 조회
  getParsedEndpoints: async (
    githubRepoId: number,
    repoFullName: string,
    branch: string
  ): Promise<GitHubParsedEndpoint[]> => {
    const res = await fetchClient.get<ApiResponse<GitHubParsedEndpoint[]>>(
      `/github/repositories/${githubRepoId}/parsed-endpoints`,
      {
        params: {
          repoFullName,
          branch,
        },
      }
    );
    return res.data ?? [];
  },
};
