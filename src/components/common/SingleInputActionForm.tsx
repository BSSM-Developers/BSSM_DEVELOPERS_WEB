"use client";

import styled from "@emotion/styled";
import { keyframes, css } from "@emotion/react";
import { applyTypography } from "@/lib/themeHelper";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { BsdevLoader } from "@/components/common/BsdevLoader";

interface SingleInputActionFormProps {
  title: string;
  subtitle?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitText: string;
  submittingText?: string;
  placeholder?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
  statusText?: string;
  errorText?: string;
  maxWidth?: string;
  animated?: boolean;
  verticalOffset?: string;
}

export function SingleInputActionForm({
  title,
  subtitle,
  label,
  value,
  onChange,
  onSubmit,
  submitText,
  submittingText = "처리 중...",
  placeholder,
  isSubmitting = false,
  isDisabled = false,
  autoFocus = true,
  statusText,
  errorText,
  maxWidth = "1000px",
  animated = false,
  verticalOffset = "-32px",
}: SingleInputActionFormProps) {
  const disabled = isSubmitting || isDisabled;
  const isLoadingStatus = Boolean(statusText?.includes("불러오는 중"));

  return (
    <Shell maxWidth={maxWidth} animated={animated} verticalOffset={verticalOffset}>
      <HeaderBlock>
        <Title>{title}</Title>
        {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
      </HeaderBlock>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled) return;
          onSubmit();
        }}
      >
        <FloatingInput
          label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        {statusText
          ? isLoadingStatus
            ? <BsdevLoader label={statusText} size={44} minHeight="72px" />
            : <StatusText>{statusText}</StatusText>
          : null}
        {errorText ? <ErrorText>{errorText}</ErrorText> : null}
        <SubmitButton type="submit" disabled={disabled}>
          {isSubmitting ? submittingText : submitText}
        </SubmitButton>
      </Form>
    </Shell>
  );
}

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Shell = styled.section<{ maxWidth: string; animated: boolean; verticalOffset: string }>`
  width: 100%;
  max-width: ${({ maxWidth }) => maxWidth};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;
  transform: translateY(${({ verticalOffset }) => verticalOffset});
  ${({ animated }) =>
    animated &&
    css`
      animation: ${slideIn} 0.6s ease-out forwards;
    `};
`;

const HeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const Title = styled.h1`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  text-align: center;
`;

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_3")};
  color: ${({ theme }) => theme.colors.grey[500]};
  text-align: center;
  max-width: 760px;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 96px;
`;

const SubmitButton = styled.button`
  width: 200px;
  height: 56px;
  padding: 0;
  align-self: center;
  background-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  border: none;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  font-size: 20px;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  text-align: center;
  margin-top: -72px;
`;

const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.bssmRed};
  text-align: center;
  margin-top: -72px;
`;
