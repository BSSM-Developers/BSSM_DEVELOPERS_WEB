import React from 'react';
import { ApiCard } from "@/components/apis/ApiCard";
import {
  ConfirmContainer,
  ConfirmTitle,
  PreviewCardWrapper,
  Footer,
  PrevButton,
  NextButton
} from '../styles';
import { Step } from '../hooks/types';

interface ConfirmStepProps {
  formData: {
    title: string;
    description: string;
  };
  userName: string;
  handleStepChange: (step: Step) => void;
  handleSubmit: () => void;
  loading: boolean;
}

export const ConfirmStep = ({
  formData,
  userName,
  handleStepChange,
  handleSubmit,
  loading
}: ConfirmStepProps) => {
  return (
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
        <PrevButton onClick={() => handleStepChange('EDITOR')}>이전으로</PrevButton>
        <NextButton onClick={handleSubmit} disabled={loading}>
          {loading ? "등록 중..." : "등록하기"}
        </NextButton>
      </Footer>
    </ConfirmContainer>
  );
};
