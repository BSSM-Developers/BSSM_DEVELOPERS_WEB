import { useState } from "react";
import { Step } from "./types";

export interface FormData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
}

export const useDocsForm = () => {
  const [step, setStep] = useState<Step>('INPUT');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    domain: '',
    repository_url: '',
    auto_approval: false
  });

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 'INPUT') {
      if (!formData.title || !formData.domain || !formData.repository_url) {
        alert("필수 항목을 모두 입력해주세요.");
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
    updateFormData,
    handleNext,
    handleStepChange
  };
};
