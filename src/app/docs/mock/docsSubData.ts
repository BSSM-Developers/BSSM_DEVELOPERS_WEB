import type { DocsBlock } from "@/types/docs";

export interface DocsSubEntry {
  id: string;
  blocks: Array<{ id: string } & DocsBlock>;
}

export const docsSubData: DocsSubEntry[] = [
  {
    id: "doc-1",
    blocks: [
      { id: "init-1", module: "headline_1", content: "시작하기" },
      {
        id: "init-2",
        module: "docs_1",
        content: "테스트 환경 주의점, 방화벽 설정, 지원 플랫폼 및 브라우저를 알아보세요",
      },
      { id: "init-3", module: "docs_1", content: "" },
      { id: "init-7", module: "docs_1", content: "" },
      { id: "init-8", module: "docs_1", content: "" },
      { id: "init-4", module: "headline_2", content: "테스트 환경" },
      {
        id: "init-5",
        module: "docs_1",
        content:
          "BSSM Developers는 개발자의 편의를 위해 라이브 환경과 비슷한 테스트 환경을 제공하고 있어요",
      },
    ],
  },
  {
    id: "doc-2",
    blocks: [
      { id: "init-1", module: "headline_1", content: "박동현" },
      { id: "init-2", module: "docs_1", content: "안녕하세요 백엔드 장인입니다" },
    ],
  },
  {
    id: "doc-3",
    blocks: [
      { id: "init-1", module: "headline_1", content: "서정현" },
      { id: "init-2", module: "docs_1", content: "안녕하세요 프론트엔드 장인입니다." },
    ],
  },
];