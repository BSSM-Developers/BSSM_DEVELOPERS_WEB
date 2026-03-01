"use client";

import { useEffect, useState, type FormEvent } from "react";
import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";

export interface MyDocsEditFormValue {
  title: string;
  description: string;
  domain: string;
  repositoryUrl: string;
}

interface MyDocsEditModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  initialValue: MyDocsEditFormValue | null;
  onClose: () => void;
  onSubmit: (value: MyDocsEditFormValue) => Promise<void>;
}

export function MyDocsEditModal({
  isOpen,
  isSubmitting,
  initialValue,
  onClose,
  onSubmit,
}: MyDocsEditModalProps) {
  const [formValue, setFormValue] = useState<MyDocsEditFormValue>({
    title: "",
    description: "",
    domain: "",
    repositoryUrl: "",
  });

  useEffect(() => {
    if (!isOpen || !initialValue) {
      return;
    }
    setFormValue(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen || !initialValue) {
    return null;
  }

  const handleChange = (key: keyof MyDocsEditFormValue, value: string) => {
    setFormValue((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      title: formValue.title.trim(),
      description: formValue.description.trim(),
      domain: formValue.domain.trim(),
      repositoryUrl: formValue.repositoryUrl.trim(),
    });
  };

  return (
    <Overlay>
      <Backdrop onClick={isSubmitting ? undefined : onClose} />
      <ModalContainer>
        <Title>문서 정보 수정</Title>
        <Description>제목, 설명, 도메인, 레포지토리 URL을 수정할 수 있어요.</Description>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>제목</Label>
            <TextInput
              value={formValue.title}
              onChange={(event) => handleChange("title", event.target.value)}
              disabled={isSubmitting}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>설명</Label>
            <TextArea
              value={formValue.description}
              onChange={(event) => handleChange("description", event.target.value)}
              disabled={isSubmitting}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>도메인</Label>
            <TextInput
              value={formValue.domain}
              onChange={(event) => handleChange("domain", event.target.value)}
              disabled={isSubmitting}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>레포지토리 URL</Label>
            <TextInput
              value={formValue.repositoryUrl}
              onChange={(event) => handleChange("repositoryUrl", event.target.value)}
              disabled={isSubmitting}
              required
            />
          </InputGroup>

          <ButtonRow>
            <CancelButton type="button" onClick={onClose} disabled={isSubmitting}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "저장"}
            </SubmitButton>
          </ButtonRow>
        </Form>
      </ModalContainer>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.section`
  position: relative;
  width: 100%;
  max-width: 620px;
  background: white;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
  padding: 24px;
`;

const Title = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0;
`;

const Description = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 8px 0 18px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

const TextInput = styled.input`
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 8px;
  padding: 0 12px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[900]};
  background: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-text-fill-color: ${({ theme }) => theme.colors.grey[900]};
    -webkit-box-shadow: 0 0 0px 1000px white inset;
    box-shadow: 0 0 0px 1000px white inset;
    transition: background-color 9999s ease-out 0s;
  }
`;

const TextArea = styled.textarea`
  min-height: 104px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 8px;
  padding: 10px 12px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[900]};
  background: white;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

const ButtonRow = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ButtonBase = styled.button`
  height: 40px;
  padding: 0 14px;
  border-radius: 8px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
  cursor: pointer;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(ButtonBase)`
  background: ${({ theme }) => theme.colors.grey[100]};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

const SubmitButton = styled(ButtonBase)`
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
`;
