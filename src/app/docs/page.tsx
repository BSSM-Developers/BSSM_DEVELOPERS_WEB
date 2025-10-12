import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlock } from "@/components/docs/DocsBlock";

export default function DocsPage() {
  return (
    <DocsLayout>
      <DocsHeader title="시작하기" breadcrumb={["가이드"]}/>
      <DocsBlock module="headline_1">시작하기</DocsBlock>
      <DocsBlock module="space"/>
      <DocsBlock module="docs_1">
        테스트 환경 주의점, 방화벽 설정, 지원 플랫폼 및 브라우저를 알아보세요.
      </DocsBlock>
      <DocsBlock module="big_space"/>
      <DocsBlock module="headline_2">테스트 환경</DocsBlock>
      <DocsBlock module="space"/>
      <DocsBlock module="space"/>
      <DocsBlock module="space"/>
      <DocsBlock module="docs_1">
        BSSM Developers는 개발자의 편의를 위해 라이브 환경과 유사한 테스트 환경을 제공합니다.
      </DocsBlock>
    </DocsLayout>
  );
}
