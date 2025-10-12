export const mockDocsData = {
  payment: {
    docs_title: "결제 API",
    docs_description: "결제 관련 엔드포인트 및 사용 예시",
    domain: "https://bssm.dev/payment",
    repository_url: "https://github.com/bssm/payment-api",
    auto_approval: true,
    docs_sections: [
      {
        docs_section_title: "결제 개요",
        docs_pages: [
          {
            docs_page_title: "시작하기",
            docs_page_description: "결제 API를 사용하기 위한 기본 개요",
            type: "markdown",
          },
        ],
      },
      {
        docs_section_title: "결제 API",
        docs_pages: [
          {
            docs_page_title: "결제 생성",
            docs_page_description: "새로운 결제를 생성합니다.",
            type: "api",
            method: "POST",
            endpoint: "/payment/create",
            request: {
              application_type: "json",
              header: ["Authorization"],
              path_params: [],
              query_params: [],
              body: { amount: "number", productId: "string" },
              cookie: [],
            },
            response: {
              application_type: "json",
              header: [],
              status_code: 200,
              body: { message: "string", data: "object" },
              cookie: [],
            },
          },
        ],
      },
    ],
  },

  user: {
    docs_title: "유저 API",
    docs_description: "유저 조회 및 관리 API",
    domain: "https://bssm.dev/user",
    repository_url: "https://github.com/bssm/user-api",
    auto_approval: false,
    docs_sections: [
      {
        docs_section_title: "유저 개요",
        docs_pages: [
          {
            docs_page_title: "유저 정보 가져오기",
            docs_page_description: "현재 로그인된 유저의 정보를 반환합니다.",
            type: "api",
            method: "GET",
            endpoint: "/user/me",
            request: {
              application_type: "json",
              header: ["Authorization"],
              path_params: [],
              query_params: [],
              body: {},
              cookie: [],
            },
            response: {
              application_type: "json",
              header: [],
              status_code: 200,
              body: { id: "number", name: "string" },
              cookie: [],
            },
          },
        ],
      },
    ],
  },
};
