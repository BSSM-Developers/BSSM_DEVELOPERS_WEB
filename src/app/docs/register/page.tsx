/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { useCreateOriginalDocsMutation, useDocsListQuery, useDocsDetailQuery } from "@/app/docs/queries";
import { docsApi } from "@/app/docs/api"; // For direct calls if needed or mutations not yet hooked
import { useMyProfileQuery } from "@/app/sign-up/queries";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { ApiCard } from "@/components/apis/ApiCard";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlock } from "@/types/docs";
import { Check } from "lucide-react";
import { useDocsStore } from "@/store/docsStore";
import { FloatingInput } from "@/components/ui/FloatingInput";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";

type Step = 'INPUT' | 'EDITOR' | 'CONFIRM' | 'SUCCESS';


export default function DocsRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('INPUT');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    repository_url: '',
    auto_approval: false
  });

  // 에디터 상태
  const [docsBlocks, setDocsBlocks] = useState<DocsBlock[]>([]);
  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, DocsBlock[]>>({});

  // 콘텐츠 전환을 위한 선택된 ID 추적
  const selectedId = useDocsStore((s: any) => s.selected);
  const prevSelectedIdRef = useRef<string | null>(null);

  const [userName, setUserName] = useState<string>('');

  const { data: profileData } = useMyProfileQuery();
  const createOriginalMutation = useCreateOriginalDocsMutation();

  useEffect(() => {
    // 1. 로컬 스토리지 먼저 확인
    const cachedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    if (cachedName) {
      setUserName(cachedName);
      return;
    }

    // 2. Query Data 사용
    if (profileData?.name) {
      setUserName(profileData.name);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userName', profileData.name);
      }
    } else {
      // Fallback
      setUserName('User');
    }
  }, [profileData]);

  // 에디터 단계 진입 시 사이드바 아이템 초기화
  useEffect(() => {
    if (step === 'EDITOR' && sidebarItems.length === 0) {
      const initialItems: SidebarNode[] = [{
        id: 'draft-root',
        label: formData.title || '새 문서',
        module: 'main',
        childrenItems: [{
          id: 'draft-doc',
          label: '시작하기',
          module: 'default',
          childrenItems: []
        }]
      }];
      setSidebarItems(initialItems);

      // 초기 선택 설정
      useDocsStore.setState({ selected: 'draft-doc' });

      // 콘텐츠 맵 초기화
      setContentMap({
        'draft-doc': [{ id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }]
      });
    }
  }, [step, formData.title]);



  const docsBlocksRef = useRef(docsBlocks);
  useEffect(() => {
    docsBlocksRef.current = docsBlocks;
  }, [docsBlocks]);

  useEffect(() => {
    if (step !== 'EDITOR') return;

    const prevId = prevSelectedIdRef.current;
    const currentId = selectedId;

    if (prevId && prevId !== currentId) {
      // ref를 사용하여 이전 콘텐츠 저장
      setContentMap(prev => ({
        ...prev,
        [prevId]: docsBlocksRef.current
      }));
    }

    if (currentId) {
      // 새 콘텐츠 로드
      setDocsBlocks(contentMap[currentId] || [{ id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }]);
    }

    prevSelectedIdRef.current = currentId;
  }, [selectedId]); // 선택 변경 시에만 실행



  const handleNext = () => {
    if (step === 'INPUT') {
      if (!formData.title || !formData.domain || !formData.repository_url) {
        alert("필수 항목을 모두 입력해주세요.");
        return;
      }
      setStep('EDITOR');
    } else if (step === 'EDITOR') {
      // 진행하기 전에 현재 블록을 맵에 저장
      if (selectedId) {
        setContentMap(prev => ({
          ...prev,
          [selectedId]: docsBlocks
        }));
      }
      setStep('CONFIRM');
    }
  };

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    const copy = [...docsBlocks];
    copy[index] = { ...copy[index], ...updated };
    setDocsBlocks(copy);
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const copy = [...docsBlocks];
    const blockId = Math.random().toString(36).substring(2, 11);
    const blockToInsert = {
      id: blockId,
      ...(newBlock ?? { module: "docs_1", content: "" }),
    } as DocsBlock;

    copy.splice(index + 1, 0, blockToInsert);
    setDocsBlocks(copy);

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${blockId}']`);
      el?.focus();
    }, 0);
  };

  const handleRemoveBlock = (index: number) => {
    const copy = [...docsBlocks];
    if (copy.length <= 1) {
      copy[0] = { ...copy[0], module: "docs_1", content: "" };
      setDocsBlocks(copy);
      return;
    }

    const focusTargetId = index > 0 ? (copy[index - 1] as any).id : (copy[index + 1] as any).id;
    copy.splice(index, 1);
    setDocsBlocks(copy);

    if (focusTargetId) {
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(`[data-block-id='${focusTargetId}']`);
        el?.focus();
      }, 0);
    }
  };

  const handleFocusMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    const targetId = (docsBlocks[target] as any)?.id;
    if (!targetId) return;
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${targetId}']`);
      el?.focus();
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 페이로드 구성
      // 사용자 편집을 반영하는 sidebarItems 상태 사용 필요
      const payload = {
        ...formData,
        sidebar: {
          title: formData.title,
          sideBarBlocks: sidebarItems // 전체 사이드바 구조 전송
        },
        docsPage: [] // 초기 내용 비움
      };

      // 실제 API 호출
      // createOriginalMutation.mutateAsync returns Promise
      const response: any = await createOriginalMutation.mutateAsync(payload as any);

      // 응답에 ID가 있으면 사용, 없으면 목록 조회
      let newDocId = response?.data?.id || response?.id || response?.docsId;

      if (!newDocId) {
        // 대체 방법: 목록 조회
        try {
          const listResponse: any = await docsApi.getList();
          if (listResponse && listResponse.data && Array.isArray(listResponse.data.values)) {
            const found = listResponse.data.values.find((d: any) => d.title === formData.title);
            if (found) {
              newDocId = found.docsId || found.id;
            }
          }
        } catch (listError) {
          console.error("Failed to fetch list for fallback ID:", listError);
        }
      }

      if (newDocId) {
        // 메인 페이지 콘텐츠 업데이트 (또는 가능한 경우 모든 페이지)

        try {
          const detailResponse = await docsApi.getDetail(newDocId);
          // 'draft-doc'(기본 시작 페이지)의 콘텐츠를 newDocId(메인에 매핑된다고 가정)에 저장 시도
          const mainContent = contentMap['draft-doc'] || docsBlocks;

          if (mainContent.length > 0) {
            await docsApi.updatePage(newDocId, newDocId, mainContent);
          }

        } catch (updateError) {
          console.error("Failed to update content:", updateError);
        }

        router.push(`/docs/${newDocId}/edit`);
      } else {
        console.error("Could not determine new document ID");
        alert("문서가 생성되었으나 ID를 확인할 수 없습니다. 목록으로 이동합니다.");
        router.push('/docs');
      }

    } catch (error: any) {
      console.error("Failed to register docs:", error);
      alert("문서 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {step === 'INPUT' && (
        <StepContainer>
          <LeftPanel>
            <Header>
              <Title>API 초기 세팅</Title>
            </Header>
            <Form>
              <FloatingInput
                label="API 이름"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />

              <FloatingInput
                label="API 소개"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />

              <FloatingInput
                label="레포지토리 이름"
                value={formData.repository_url}
                onChange={e => setFormData({ ...formData, repository_url: e.target.value })}
              />

              <FloatingInput
                label="도메인 주소"
                value={formData.domain}
                onChange={e => setFormData({ ...formData, domain: e.target.value })}
              />

              <InputGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
                <CheckboxWrapper>
                  <Checkbox
                    type="checkbox"
                    id="auto_approval"
                    checked={formData.auto_approval}
                    onChange={e => setFormData({ ...formData, auto_approval: e.target.checked })}
                  />
                </CheckboxWrapper>
                <label htmlFor="auto_approval" style={{ fontSize: '15px', color: '#374151', cursor: 'pointer', fontFamily: '"Spoqa Han Sans Neo", sans-serif' }}>
                  자동 승인 활성화
                </label>
              </InputGroup>
            </Form>
            <Footer>
              <PrevButton onClick={() => router.back()}>이전으로</PrevButton>
              <NextButton onClick={handleNext}>다음으로</NextButton>
            </Footer>
          </LeftPanel>

          <RightPanel>
            {(formData.title || formData.description) && (
              <PreviewCardWrapper>
                <ApiCard
                  id="preview"
                  title={formData.title}
                  description={formData.description || ''}
                  tags={[userName]}
                  onExplore={() => { }}
                  onUse={() => { }}
                />
              </PreviewCardWrapper>
            )}
          </RightPanel>
        </StepContainer>
      )}

      {step === 'EDITOR' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 100, background: 'white' }}>
          <DocsLayout
            showSidebar={true}
            sidebarItems={sidebarItems}
            onSidebarChange={setSidebarItems}
          >
            <DocsHeader title={formData.title || "새 문서"} breadcrumb={["문서 등록", formData.title]} isApi={false} />
            <div style={{ minHeight: "500px" }} onClick={() => {
              if (docsBlocks.length === 0) {
                setDocsBlocks([{ id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }]);
              }
            }}>
              {docsBlocks.length === 0 ? (
                <div style={{ padding: "20px 0", color: "#9CA3AF", cursor: "text" }}>
                  내용을 입력하려면 클릭하세요...
                </div>
              ) : (
                docsBlocks.map((block, i) => (
                  <DocsBlockEditor
                    key={(block as any).id || i}
                    index={i}
                    block={block}
                    onChange={handleBlockChange}
                    onAddBlock={handleAddBlock}
                    onRemoveBlock={handleRemoveBlock}
                    onFocusMove={handleFocusMove}
                  />
                ))
              )}
            </div>
            <div style={{
              position: 'fixed',
              bottom: '20px',
              right: '40px',
              display: 'flex',
              gap: '10px',
              zIndex: 1000
            }}>
              <PrevButton onClick={() => setStep('INPUT')} style={{ background: 'white', border: '1px solid #E5E7EB' }}>이전으로</PrevButton>
              <NextButton onClick={handleNext}>다음으로</NextButton>
            </div>
          </DocsLayout>
        </div>
      )}

      {step === 'CONFIRM' && (
        <ConfirmContainer>
          <ConfirmTitle>아래의 API를 BSSM DEVLEOPERS에 등록하시겠습니까?</ConfirmTitle>
          <PreviewCardWrapper>
            <ApiCard
              id="preview-confirm"
              title={formData.title || 'BSSM DEVELOPERS'}
              description={formData.description || '2025 BSSM 해커톤 시즌 1 - BSSM Developers 공식 문서입니다.'}
              tags={[userName]}
              onExplore={() => { }}
              onUse={() => { }}
            />
          </PreviewCardWrapper>
          <Footer style={{ justifyContent: 'center', marginTop: '60px' }}>
            <PrevButton onClick={() => setStep('EDITOR')}>이전으로</PrevButton>
            <NextButton onClick={handleSubmit} disabled={loading}>
              {loading ? "등록 중..." : "등록하기"}
            </NextButton>
          </Footer>
        </ConfirmContainer>
      )}

      {step === 'SUCCESS' && (
        <SuccessContainer>
          <SuccessTitle>API 등록이 완료되었습니다!</SuccessTitle>
          <CheckCircle>
            <Check size={64} color="#16335C" strokeWidth={3} />
          </CheckCircle>
          <NextButton onClick={() => router.push('/apis')} style={{ width: '200px', marginTop: '40px' }}>
            완료
          </NextButton>
        </SuccessContainer>
      )}
    </Container>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px;
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StepContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 80px;
`;

const LeftPanel = styled.div`
  flex: 1;
`;

const RightPanel = styled.div`
  width: 400px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 80px;
`;

const Header = styled.div`
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const Footer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 60px;
`;

const Button = styled.button`
  padding: 12px 32px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  transition: all 0.2s;
`;

const PrevButton = styled(Button)`
  background: white;
  border: 1px solid #E5E7EB;
  color: #000;
  
  &:hover {
    background: #F9FAFB;
  }
`;

const NextButton = styled(Button)`
  background: #16335C;
  border: 1px solid #16335C;
  color: white;

  &:hover {
    background: #1a3a68;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ConfirmContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const ConfirmTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-bottom: 60px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const PreviewCardWrapper = styled.div`
  width: 400px;
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SuccessTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-bottom: 60px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const CheckCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid #16335C;
  display: flex;
  justify-content: center;
  align-items: center;
`;


