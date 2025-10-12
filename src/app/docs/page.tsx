import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsSection } from "@/components/docs/DocsSection";
import { DocsParagraph } from "@/components/docs/DocsParagraph";

export default function DocsPage() {
  return (
    <DocsLayout>
      <DocsHeader title="시작하기" breadcrumb={["가이드"]}/>
      <DocsSection title="시작하기">
        <DocsParagraph>
          테스트 환경 주의점, 브라우저 설정 및 플랫폼을 알아보세요.
        </DocsParagraph>

        <DocsParagraph>
          BSSM Developers는 개발자 편의를 위해 라이브 환경과 유사한 테스트 환경을 제공합니다.
        </DocsParagraph>
      </DocsSection>
    </DocsLayout>
  );
}
