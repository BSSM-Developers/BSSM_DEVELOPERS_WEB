import React from 'react';
import { useRouter } from 'next/navigation';
import { FloatingInput } from "@/components/ui/FloatingInput";
import { ApiCard } from "@/components/apis/ApiCard";
import {
  StepContainer,
  LeftPanel,
  RightPanel,
  Header,
  Title,
  Form,
  InputGroup,
  CheckboxWrapper,
  Checkbox,
  Footer,
  PrevButton,
  NextButton,
  PreviewCardWrapper
} from '../styles';

import type { FormData } from '../hooks/useDocsForm';

interface InputStepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string | boolean) => void;
  handleNext: () => void;
  userName: string;
}

export const InputStep = ({ formData, updateFormData, handleNext, userName }: InputStepProps) => {
  const router = useRouter();

  return (
    <StepContainer>
      <LeftPanel>
        <Header>
          <Title>API 초기 세팅</Title>
        </Header>
        <Form>
          <FloatingInput
            label="API 이름"
            value={formData.title}
            onChange={e => updateFormData('title', e.target.value)}
          />

          <FloatingInput
            label="API 소개"
            value={formData.description}
            onChange={e => updateFormData('description', e.target.value)}
          />

          <FloatingInput
            label="레포지토리 이름"
            value={formData.repository_url}
            onChange={e => updateFormData('repository_url', e.target.value)}
          />

          <FloatingInput
            label="도메인 주소"
            value={formData.domain}
            onChange={e => updateFormData('domain', e.target.value)}
          />

          <InputGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
            <CheckboxWrapper>
              <Checkbox
                type="checkbox"
                id="auto_approval"
                checked={formData.auto_approval}
                onChange={e => updateFormData('auto_approval', e.target.checked)}
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
  );
};
