import type { ApiDoc } from "@/types/docs";

export const apiMockData: Record<string, ApiDoc> = {
  "user-add": {
    id: "user-add",
    name: "추가 정보 입력",
    method: "POST",
    endpoint: "/user/add",
    description: "추가 입력할 정보가 필요합니다",
    headerParams: [
      {
        name: "access-token",
        type: "string",
        description: "액세스 토큰",
        required: true,
      },
    ],
    bodyParams: [
      {
        name: "nickName",
        type: "string",
        description: "닉네임 입력",
        required: true,
      },
      {
        name: "realName",
        type: "string",
        description: "실명 입력",
        required: true,
      },
    ],
    responseParams: [
      {
        name: "id",
        type: "string",
        description: "사용자 고유 ID",
      },
      {
        name: "nickName",
        type: "string",
        description: "사용자 닉네임",
      },
    ],
  },
  "user-profile": {
    id: "user-profile",
    name: "프로필 조회",
    method: "GET",
    endpoint: "/user/profile",
    description: "사용자 프로필 정보를 조회합니다",
    headerParams: [
      {
        name: "access-token",
        type: "string",
        description: "액세스 토큰",
        required: true,
      },
    ],
    responseParams: [
      {
        name: "id",
        type: "string",
        description: "사용자 고유 ID",
      },
      {
        name: "nickName",
        type: "string",
        description: "사용자 닉네임",
      },
      {
        name: "email",
        type: "string",
        description: "사용자 이메일",
      },
      {
        name: "profileImage",
        type: "string",
        description: "프로필 이미지 URL",
      },
    ],
  },
  "google-login": {
    id: "google-login",
    name: "구글 로그인",
    method: "POST",
    endpoint: "/auth/google",
    description: "구글 계정으로 로그인합니다",
    bodyParams: [
      {
        name: "code",
        type: "string",
        description: "구글 인증 코드",
        required: true,
      },
    ],
    responseParams: [
      {
        name: "accessToken",
        type: "string",
        description: "액세스 토큰",
      },
      {
        name: "refreshToken",
        type: "string",
        description: "리프레시 토큰",
      },
    ],
  },
  "google-url": {
    id: "google-url",
    name: "구글 로그인 url 조회",
    method: "GET",
    endpoint: "/auth/google/url",
    description: "구글 로그인 URL을 반환합니다",
  },
  "token-refresh": {
    id: "token-refresh",
    name: "토큰 재발급",
    method: "GET",
    endpoint: "/auth/token/refresh",
    description: "액세스 토큰을 재발급합니다",
    headerParams: [
      {
        name: "refresh-token",
        type: "string",
        description: "리프레시 토큰",
        required: true,
      },
    ],
    responseParams: [
      {
        name: "accessToken",
        type: "string",
        description: "새로운 액세스 토큰",
      },
    ],
  },
  logout: {
    id: "logout",
    name: "로그아웃",
    method: "GET",
    endpoint: "/auth/logout",
    description: "현재 세션을 종료합니다",
    headerParams: [
      {
        name: "access-token",
        type: "string",
        description: "액세스 토큰",
        required: true,
      },
    ],
  },
  "fact-create": {
    id: "fact-create",
    name: "사실 작성",
    method: "POST",
    endpoint: "/fact/create",
    description: "새로운 사실을 작성합니다",
    headerParams: [
      {
        name: "access-token",
        type: "string",
        description: "액세스 토큰",
        required: true,
      },
    ],
    bodyParams: [
      {
        name: "content",
        type: "string",
        description: "사실 내용",
        required: true,
      },
    ],
  },
  "fact-delete": {
    id: "fact-delete",
    name: "사실 제거",
    method: "DELETE",
    endpoint: "/fact/:id",
    description: "특정 사실을 삭제합니다",
    headerParams: [
      {
        name: "access-token",
        type: "string",
        description: "액세스 토큰",
        required: true,
      },
    ],
  },
  "fact-update-create": {
    id: "fact-update-create",
    name: "인지 왜곡 수정 글 작성",
    method: "POST",
    endpoint: "/fact/update/create",
    description: "인지 왜곡을 수정하는 글을 작성합니다",
    headerParams: [
      {
        name: "access-token",
        type: "string",
        description: "액세스 토큰",
        required: true,
      },
    ],
    bodyParams: [
      {
        name: "factId",
        type: "number",
        description: "사실 ID",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "수정 내용",
        required: true,
      },
    ],
  },
  "fact-update-view": {
    id: "fact-update-view",
    name: "인지 왜곡 수정 글 조회",
    method: "GET",
    endpoint: "/fact/update/:id",
    description: "인지 왜곡 수정 글을 조회합니다",
    headerParams: [
      {
        name: "access-token",
        type: "string",
        description: "액세스 토큰",
        required: true,
      },
    ],
  },
};
