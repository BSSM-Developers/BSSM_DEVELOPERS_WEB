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
  TypeSelector,
  TypeButton,
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
  const isCustom = formData.docsType === "CUSTOM";

  return (
    <StepContainer>
      <LeftPanel>
        <Header>
          <Title>문서 초기 세팅</Title>
        </Header>
        <Form>
          <InputGroup>
            <TypeSelector>
              <TypeButton
                type="button"
                selected={formData.docsType === "ORIGINAL"}
                onClick={() => updateFormData("docsType", "ORIGINAL")}
              >
                Original API
              </TypeButton>
              <TypeButton
                type="button"
                selected={formData.docsType === "CUSTOM"}
                onClick={() => updateFormData("docsType", "CUSTOM")}
              >
                Custom API
              </TypeButton>
            </TypeSelector>
          </InputGroup>

          <FloatingInput
            label={isCustom ? "커스텀 문서 제목" : "API 이름"}
            value={formData.title}
            onChange={e => updateFormData('title', e.target.value)}
          />

          <FloatingInput
            label={isCustom ? "커스텀 문서 소개" : "API 소개"}
            value={formData.description}
            onChange={e => updateFormData('description', e.target.value)}
          />

          {!isCustom && (
            <FloatingInput
              label="레포지토리 이름"
              value={formData.repository_url}
              onChange={e => updateFormData('repository_url', e.target.value)}
            />
          )}

          {!isCustom && (
            <FloatingInput
              label="도메인 주소"
              value={formData.domain}
              onChange={e => updateFormData('domain', e.target.value)}
            />
          )}

          {!isCustom && (
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
          )}
        </Form>
        <Footer>
          <PrevButton onClick={() => router.back()}>이전으로</PrevButton>
          <NextButton onClick={handleNext}>{isCustom ? "생성하기" : "다음으로"}</NextButton>
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
            />
          </PreviewCardWrapper>
        )}
      </RightPanel>
    </StepContainer>
  );
};
