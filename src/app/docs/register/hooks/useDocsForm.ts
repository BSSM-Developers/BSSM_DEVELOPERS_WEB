import { useState } from "react";
import { DocsRegisterType, Step } from "./types";

export interface FormData {
  docsType: DocsRegisterType;
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
}

export const useDocsForm = () => {
  const [step, setStep] = useState<Step>('INPUT');
  const [formData, setFormData] = useState<FormData>({
    docsType: "ORIGINAL",
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
      if (!formData.title || !formData.description) {
        return;
      }
      if (formData.docsType === "ORIGINAL" && (!formData.domain || !formData.repository_url)) {
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
