import { useState } from "react";
import { DocsRegisterType, Step } from "./types";

export interface FormData {
  docsType: DocsRegisterType;
  title: string;
  description: string;
  domain: string;
  selectedRepoFullName: string; // "owner/repo" 형식 → repo_full_name 으로 서버 전송
  selectedRepoId: number | null; // 선택된 레포의 숫자 id → parsed-endpoints 호출용
  selectedBranch: string;       // 선택된 브랜치명 → branch 로 서버 전송
  auto_approval: boolean;
}

export const useDocsForm = () => {
  const [step, setStep] = useState<Step>('INPUT');
  const [formData, setFormData] = useState<FormData>({
    docsType: "ORIGINAL",
    title: '',
    description: '',
    domain: '',
    selectedRepoFullName: '',
    selectedRepoId: null,
    selectedBranch: '',
    auto_approval: false
  });

  const updateFormData = (field: keyof FormData, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 'INPUT') {
      if (!formData.title || !formData.description) {
        return;
      }
      if (
        formData.docsType === "ORIGINAL" &&
        (!formData.domain || !formData.selectedRepoFullName || !formData.selectedBranch)
      ) {
        return;
      }
      setStep('EDITOR');
    }
  };

  const handleStepChange = (newStep: Step) => {
    setStep(newStep);
  };

  return {
    step,
    setStep,
    formData,
    setFullFormData: setFormData,
    updateFormData,
    handleNext,
    handleStepChange
  };
};
