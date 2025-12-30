"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { api } from "@/lib/api";
import { ApiCard } from "@/components/apis/ApiCard";
import { Check } from "lucide-react";

type Step = 'INPUT' | 'CONFIRM' | 'SUCCESS';

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

  const handleNext = () => {
    if (!formData.title || !formData.domain || !formData.repository_url) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    setStep('CONFIRM');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Default to ORIGINAL for now as per design assumption, or we could add a toggle if needed.
      // The design shows "API 초기 세팅" which implies a standard flow.
      // We'll use createOriginal as default.
      await api.docs.createOriginal({
        ...formData,
        sidebar: {
          title: formData.title,
          sideBarBlocks: []
        }
      });
      setStep('SUCCESS');
    } catch (error) {
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
              <InputGroup>
                <Label>API 이름</Label>
                <Input
                  placeholder="API 이름을 입력해주세요"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </InputGroup>

              <InputGroup>
                <Label>API 소개</Label>
                <Input
                  placeholder="API에 대한 설명을 입력해주세요"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </InputGroup>

              <InputGroup>
                <Label>레포지토리 이름</Label>
                <Input
                  placeholder="repository-url"
                  value={formData.repository_url}
                  onChange={e => setFormData({ ...formData, repository_url: e.target.value })}
                />
              </InputGroup>

              <InputGroup>
                <Label>도메인 주소</Label>
                <Input
                  placeholder="도메인 주소"
                  value={formData.domain}
                  onChange={e => setFormData({ ...formData, domain: e.target.value })}
                />
              </InputGroup>

              <InputGroup>
                <Label>자동 승인</Label>
                <CheckboxWrapper>
                  <Checkbox
                    type="checkbox"
                    checked={formData.auto_approval}
                    onChange={e => setFormData({ ...formData, auto_approval: e.target.checked })}
                  />
                </CheckboxWrapper>
              </InputGroup>
            </Form>
            <Footer>
              <PrevButton onClick={() => router.back()}>이전으로</PrevButton>
              <NextButton onClick={handleNext}>다음으로</NextButton>
            </Footer>
          </LeftPanel>

          <RightPanel>
            {formData.title && (
              <PreviewCardWrapper>
                <ApiCard
                  id="preview"
                  title={formData.title}
                  description={formData.description || ''}
                  tags={['REST API', 'V1']}
                  onExplore={() => { }}
                  onUse={() => { }}
                />
              </PreviewCardWrapper>
            )}
          </RightPanel>
        </StepContainer>
      )}

      {step === 'CONFIRM' && (
        <ConfirmContainer>
          <ConfirmTitle>아래의 API를 BSSM DEVLEOPERS에 등록하시겠습니까?</ConfirmTitle>
          <PreviewCardWrapper>
            <ApiCard
              id="preview-confirm"
              title={formData.title || 'BSSM DEVELOPERS'}
              description={formData.description || '2025 BSSM 해커톤 시즌 1 - BSSM Developers 공식 문서입니다.'}
              tags={['REST API', 'V1']}
              onExplore={() => { }}
              onUse={() => { }}
            />
          </PreviewCardWrapper>
          <Footer style={{ justifyContent: 'center', marginTop: '60px' }}>
            <PrevButton onClick={() => setStep('INPUT')}>이전으로</PrevButton>
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
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: 700;
  color: #000;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Input = styled.input`
  padding: 16px 8px;
  border: none;
  border-bottom: 1px solid #E5E7EB;
  font-size: 16px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  width: 100%;
  
  &:focus {
    outline: none;
    border-bottom-color: #16335C;
  }

  &::placeholder {
    color: #9CA3AF;
  }
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

const PreviewLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #000;
  margin-bottom: 8px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  background: #16335C;
  border-radius: 50%;
`;

const PreviewTitle = styled.div`
  font-size: 16px;
  color: #4B5563;
  padding-left: 14px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const PreviewDesc = styled.div`
  font-size: 14px;
  color: #9CA3AF;
  padding-left: 14px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

// Confirm Step Styles
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

// Success Step Styles
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
