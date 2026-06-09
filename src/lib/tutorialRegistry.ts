import type { TutorialStep } from "@/components/onboarding/Spotlight";

/**
 * 코드 기본 튜토리얼 정의 (pathKey → steps).
 * dev 편집기로 만든 localStorage 오버라이드가 있으면 그게 우선이고,
 * 없으면 여기 기본값이 재생된다. 전역 TutorialPlayer가 이 레지스트리를 사용.
 *
 * pathKey는 normalizePath() 기준 (동적 세그먼트는 [id]).
 */
export const TUTORIAL_REGISTRY: Record<string, TutorialStep[]> = {
  "/user": [
    {
      selector: '[data-tour="github-menu"]',
      title: "GitHub 계정을 연동해보세요",
      body: "여기 'GitHub 연동' 메뉴에서 내 GitHub 계정을 연결할 수 있어요.",
    },
    {
      selector: '[data-tour="github-menu"]',
      title: "내 레포로 API 문서 자동 생성",
      body: "계정을 연동하면 내 레포지토리의 엔드포인트를 불러와 API 문서를 빠르게 만들 수 있어요.",
    },
  ],
  "/docs/register": [
    {
      selector: '[data-tour="docs-add"]',
      title: "모듈 추가하기",
      body: "이 버튼으로 API 문서, 제목, 설명 같은 모듈을 사이드바에 추가할 수 있어요.",
    },
    {
      selector: '[data-tour="docs-content"]',
      title: "내용 작성",
      body: "이 영역을 클릭해 문서 내용을 작성하세요. 엔드포인트·파라미터·설명을 채울 수 있어요.",
    },
    {
      selector: '[data-tour="docs-next"]',
      title: "다음 단계로",
      body: "작성이 끝나면 '다음으로'를 눌러 미리보기·등록 단계로 진행하세요.",
    },
  ],
  "/docs/[id]/page/[id]": [
    {
      selector: '[data-tour="api-request"]',
      title: "API 사용법 확인",
      body: "여기서 엔드포인트, 요청/응답 형식과 예시 코드를 확인할 수 있어요.",
    },
    {
      selector: '[data-tour="api-apply"]',
      title: "사용 신청 & 토큰 발급",
      body: "이 API를 쓰려면 '사용 신청'을 누르세요. 승인되면 토큰이 발급돼 호출할 수 있어요.",
    },
  ],
};

/** pathKey에 해당하는 코드 기본 steps (없으면 빈 배열) */
export const getRegistrySteps = (pathKey: string): TutorialStep[] =>
  TUTORIAL_REGISTRY[pathKey] ?? [];
