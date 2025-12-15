import type { HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";

export interface ApiDocData {
  id: string;
  name: string;
  method: HttpMethod;
  endpoint: string;
  description: string;
  headerParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  bodyParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  sampleCode?: string;
  responseCode?: string;
}

export const apiDocsData: Record<string, ApiDocData> = {
  "user-add": {
    id: "user-add",
    name: "추가 정보 입력",
    method: "POST",
    endpoint: "/user/add",
    description: "추가 정보 입력에 관한 API 명세입니다.",
    headerParams: [
      {
        name: "Authorization",
        type: "string",
        description: "access token",
        required: true
      }
    ],
    bodyParams: [
      {
        name: "nickName",
        type: "string",
        description: "닉네임 입니다.",
        required: true
      },
      {
        name: "age",
        type: "integer",
        description: "나이 입니다.",
        required: true
      },
      {
        name: "email",
        type: "string",
        description: "이메일 주소 입니다.",
        required: true
      },
      {
        name: "phone",
        type: "string",
        description: "전화번호 입니다.",
        required: false
      },
      {
        name: "address",
        type: "string",
        description: "주소 입니다.",
        required: false
      },
      {
        name: "bio",
        type: "string",
        description: "자기소개 입니다.",
        required: false
      }
    ],
    sampleCode: `<span style="color: #ff7b72">var</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">var</span> config = {
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'post'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/user/add'</span>,
  <span style="color: #9fcef8">headers</span>: {
    <span style="color: #9fcef8">'Authorization'</span>: <span style="color: #9fcef8">'Bearer YOUR_TOKEN_HERE'</span>
  },
  <span style="color: #9fcef8">data</span>: {
    <span style="color: #9fcef8">'nickName'</span>: <span style="color: #9fcef8">'사용자명'</span>,
    <span style="color: #9fcef8">'age'</span>: <span style="color: #9fcef8">25</span>,
    <span style="color: #9fcef8">'email'</span>: <span style="color: #9fcef8">'user@example.com'</span>
  }
};

<span style="color: #cda3f9">axios</span>(config)
.<span style="color: #cda3f9">then</span>(<span style="color: #ff7b72">function</span> (response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(<span style="color: #cda3f9">JSON.stringify</span>(response.data));
})
.<span style="color: #cda3f9">catch</span>(<span style="color: #ff7b72">function</span> (error) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(error);
});`,
    responseCode: `{
  <span style="color: #9fcef8">"status"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">200</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"message"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"성공"</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"data"</span><span style="color: #d1d6db">:</span> {
    <span style="color: #9fcef8">"userId"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">123</span><span style="color: #d1d6db">,</span>
    <span style="color: #9fcef8">"nickName"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"사용자명"</span>
  }
}`
  },

  "user-profile": {
    id: "user-profile",
    name: "프로필 조회",
    method: "GET",
    endpoint: "/user/profile",
    description: "사용자 프로필 조회에 관한 API 명세입니다.",
    headerParams: [
      {
        name: "Authorization",
        type: "string",
        description: "access token",
        required: true
      }
    ],
    sampleCode: `<span style="color: #ff7b72">var</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">var</span> config = {
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'get'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/user/profile'</span>,
  <span style="color: #9fcef8">headers</span>: {
    <span style="color: #9fcef8">'Authorization'</span>: <span style="color: #9fcef8">'Bearer YOUR_TOKEN_HERE'</span>
  }
};

<span style="color: #cda3f9">axios</span>(config)
.<span style="color: #cda3f9">then</span>(<span style="color: #ff7b72">function</span> (response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(<span style="color: #cda3f9">JSON.stringify</span>(response.data));
})
.<span style="color: #cda3f9">catch</span>(<span style="color: #ff7b72">function</span> (error) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(error);
});`,
    responseCode: `{
  <span style="color: #9fcef8">"status"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">200</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"message"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"성공"</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"data"</span><span style="color: #d1d6db">:</span> {
    <span style="color: #9fcef8">"userId"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">123</span><span style="color: #d1d6db">,</span>
    <span style="color: #9fcef8">"nickName"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"사용자명"</span><span style="color: #d1d6db">,</span>
    <span style="color: #9fcef8">"email"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"user@example.com"</span><span style="color: #d1d6db">,</span>
    <span style="color: #9fcef8">"age"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">25</span>
  }
}`
  },

  "google-login": {
    id: "google-login",
    name: "구글 로그인",
    method: "POST",
    endpoint: "/auth/google",
    description: "구글 OAuth를 통한 로그인 API 명세입니다.",
    bodyParams: [
      {
        name: "code",
        type: "string",
        description: "구글 인증 코드",
        required: true
      }
    ],
    sampleCode: `<span style="color: #ff7b72">var</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">var</span> config = {
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'post'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/auth/google'</span>,
  <span style="color: #9fcef8">data</span>: {
    <span style="color: #9fcef8">'code'</span>: <span style="color: #9fcef8">'GOOGLE_AUTH_CODE'</span>
  }
};

<span style="color: #cda3f9">axios</span>(config)
.<span style="color: #cda3f9">then</span>(<span style="color: #ff7b72">function</span> (response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(<span style="color: #cda3f9">JSON.stringify</span>(response.data));
})
.<span style="color: #cda3f9">catch</span>(<span style="color: #ff7b72">function</span> (error) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(error);
});`,
    responseCode: `{
  <span style="color: #9fcef8">"status"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">200</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"message"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"로그인 성공"</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"data"</span><span style="color: #d1d6db">:</span> {
    <span style="color: #9fcef8">"accessToken"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"eyJhbGciOiJIUzI1NiIs..."</span><span style="color: #d1d6db">,</span>
    <span style="color: #9fcef8">"refreshToken"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"eyJhbGciOiJIUzI1NiIs..."</span>
  }
}`
  },

  "google-url": {
    id: "google-url",
    name: "구글 로그인 URL 조회",
    method: "GET",
    endpoint: "/auth/google/url",
    description: "구글 OAuth 로그인 URL 조회 API 명세입니다.",
    sampleCode: `<span style="color: #ff7b72">var</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">var</span> config = {
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'get'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/auth/google/url'</span>
};

<span style="color: #cda3f9">axios</span>(config)
.<span style="color: #cda3f9">then</span>(<span style="color: #ff7b72">function</span> (response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(<span style="color: #cda3f9">JSON.stringify</span>(response.data));
})
.<span style="color: #cda3f9">catch</span>(<span style="color: #ff7b72">function</span> (error) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(error);
});`,
    responseCode: `{
  <span style="color: #9fcef8">"status"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">200</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"message"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"성공"</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"data"</span><span style="color: #d1d6db">:</span> {
    <span style="color: #9fcef8">"url"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"https://accounts.google.com/oauth2/auth?..."</span>
  }
}`
  },

  "fact-create": {
    id: "fact-create",
    name: "사실 작성",
    method: "POST",
    endpoint: "/fact",
    description: "새로운 사실을 작성하는 API 명세입니다.",
    headerParams: [
      {
        name: "Authorization",
        type: "string",
        description: "access token",
        required: true
      }
    ],
    bodyParams: [
      {
        name: "title",
        type: "string",
        description: "사실 제목",
        required: true
      },
      {
        name: "content",
        type: "string",
        description: "사실 내용",
        required: true
      },
      {
        name: "category",
        type: "string",
        description: "카테고리",
        required: false
      }
    ],
    sampleCode: `<span style="color: #ff7b72">var</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">var</span> config = {
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'post'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/fact'</span>,
  <span style="color: #9fcef8">headers</span>: {
    <span style="color: #9fcef8">'Authorization'</span>: <span style="color: #9fcef8">'Bearer YOUR_TOKEN_HERE'</span>
  },
  <span style="color: #9fcef8">data</span>: {
    <span style="color: #9fcef8">'title'</span>: <span style="color: #9fcef8">'사실 제목'</span>,
    <span style="color: #9fcef8">'content'</span>: <span style="color: #9fcef8">'사실 내용'</span>,
    <span style="color: #9fcef8">'category'</span>: <span style="color: #9fcef8">'일반'</span>
  }
};

<span style="color: #cda3f9">axios</span>(config)
.<span style="color: #cda3f9">then</span>(<span style="color: #ff7b72">function</span> (response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(<span style="color: #cda3f9">JSON.stringify</span>(response.data));
})
.<span style="color: #cda3f9">catch</span>(<span style="color: #ff7b72">function</span> (error) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(error);
});`,
    responseCode: `{
  <span style="color: #9fcef8">"status"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">201</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"message"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"사실 생성 성공"</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"data"</span><span style="color: #d1d6db">:</span> {
    <span style="color: #9fcef8">"factId"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">456</span><span style="color: #d1d6db">,</span>
    <span style="color: #9fcef8">"title"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"사실 제목"</span>
  }
}`
  },

  "fact-delete": {
    id: "fact-delete",
    name: "사실 제거",
    method: "DELETE",
    endpoint: "/fact/{factId}",
    description: "기존 사실을 제거하는 API 명세입니다.",
    headerParams: [
      {
        name: "Authorization",
        type: "string",
        description: "access token",
        required: true
      }
    ],
    sampleCode: `<span style="color: #ff7b72">var</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">var</span> config = {
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'delete'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'/fact/456'</span>,
  <span style="color: #9fcef8">headers</span>: {
    <span style="color: #9fcef8">'Authorization'</span>: <span style="color: #9fcef8">'Bearer YOUR_TOKEN_HERE'</span>
  }
};

<span style="color: #cda3f9">axios</span>(config)
.<span style="color: #cda3f9">then</span>(<span style="color: #ff7b72">function</span> (response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(<span style="color: #cda3f9">JSON.stringify</span>(response.data));
})
.<span style="color: #cda3f9">catch</span>(<span style="color: #ff7b72">function</span> (error) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(error);
});`,
    responseCode: `{
  <span style="color: #9fcef8">"status"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">200</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"message"</span><span style="color: #d1d6db">:</span> <span style="color: #9fcef8">"사실 삭제 성공"</span><span style="color: #d1d6db">,</span>
  <span style="color: #9fcef8">"data"</span><span style="color: #d1d6db">:</span> <span style="color: #ff7b72">null</span>
}`
  }
};