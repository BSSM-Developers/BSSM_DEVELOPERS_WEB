"use client";

import { applyTypography } from "@/lib/themeHelper";
import { keyframes, css } from "@emotion/react";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { tokenApi, type ApiTokenWithSecret } from "../api";
import { useConfirm } from "@/hooks/useConfirm";

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

const drawCheck = keyframes`
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
  }
`;

const popIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  60% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const ringPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(17, 38, 146, 0.35);
  }
  100% {
    box-shadow: 0 0 0 18px rgba(17, 38, 146, 0);
  }
`;

const checkPop = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.6) rotate(-6deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.1) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
`;

export default function TokenIssuePage() {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [step, setStep] = useState<"INPUT" | "SUCCESS">("INPUT");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedToken, setIssuedToken] = useState<ApiTokenWithSecret | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleIssue = useCallback(async () => {
    if (!name.trim() || isSubmitting) {
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);
      const createdToken = await tokenApi.create(name.trim());
      setIssuedToken(createdToken);
      setStep("SUCCESS");
    } catch (error) {
      const message = error instanceof Error ? error.message : "토큰 발급에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, name]);

  const handleComplete = useCallback(() => {
    if (!issuedToken) {
      router.push("/user/tokens");
      return;
    }
    router.push(`/user/tokens/${issuedToken.apiTokenId}`);
  }, [issuedToken, router]);

  const handleCopy = useCallback(async (value: string) => {
    await navigator.clipboard.writeText(value);
    await confirm({
      title: "복사가 완료되었습니다",
      message: "클립보드에 복사되었습니다.",
      confirmText: "확인",
    });
  }, [confirm]);

  if (step === "SUCCESS") {
    return (
      <Container center>
        <FlexColumn center animated>
          <SuccessTitle>토큰 발급이 완료되었습니다!</SuccessTitle>
          <CheckCircle>
            <CheckIcon viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </CheckIcon>
          </CheckCircle>
          {issuedToken ? (
            <IssuedInfoList>
              <IssuedInfoRow>
                <IssuedInfoLabel>토큰 이름</IssuedInfoLabel>
                <IssuedInfoValue>{issuedToken.apiTokenName}</IssuedInfoValue>
              </IssuedInfoRow>
              <IssuedInfoRow>
                <IssuedInfoLabel>클라이언트 ID</IssuedInfoLabel>
                <IssuedInfoValue>{issuedToken.apiTokenClientId}</IssuedInfoValue>
                <InfoButton onClick={() => void handleCopy(issuedToken.apiTokenClientId)}>복사</InfoButton>
              </IssuedInfoRow>
              <IssuedInfoRow>
                <IssuedInfoLabel>시크릿 키</IssuedInfoLabel>
                <IssuedInfoValue>{issuedToken.secretKey}</IssuedInfoValue>
                <InfoButton onClick={() => void handleCopy(issuedToken.secretKey)}>복사</InfoButton>
              </IssuedInfoRow>
            </IssuedInfoList>
          ) : null}
          <CompleteButton onClick={handleComplete}>완료</CompleteButton>
          {ConfirmDialog}
        </FlexColumn>
      </Container>
    );
  }

  return (
    <Container center>
      <FlexColumn center animated>
        <InputTitle>신규 발급 받을 토큰 이름을 입력해주세요</InputTitle>
        <StyledInput
          placeholder="토큰 이름을 입력해주세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleIssue()}
          autoFocus
        />
        {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}
        <IssueButton onClick={() => void handleIssue()} disabled={!name.trim() || isSubmitting}>
          {isSubmitting ? "발급 중..." : "발급받기"}
        </IssueButton>
      </FlexColumn>
    </Container>
  );
}

const Container = styled.div<{ center?: boolean }>`
  display: flex;
  flex: 1;
  background: white;
  ${({ center }) => center && "justify-content: center; align-items: center;"}
  padding: 24px;
`;

const FlexColumn = styled.div<{ center?: boolean; animated?: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ center }) => center && "align-items: center;"}
  width: 100%;
  max-width: 800px;
  ${({ animated }) => animated && css`
    animation: ${slideIn} 0.6s ease-out forwards;
  `}
`;

const InputTitle = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  font-size: 32px;
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 32px;
  text-align: center;
`;

const StyledInput = styled.input`
  width: 100%;
  height: 56px;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.grey[100]};
  border-radius: 4px;
  background-color: white;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  margin-bottom: 120px;
  outline: none;
  color: ${({ theme }) => theme.colors.grey[900]};

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[400]};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

const IssueButton = styled.button`
  width: 200px;
  height: 56px;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  font-size: 20px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const SuccessTitle = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  font-size: 32px;
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 36px;
  text-align: center;
`;

const IssuedInfoList = styled.div`
  width: 100%;
  margin-bottom: 36px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 8px;
  overflow: hidden;
`;

const IssuedInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[100]};

  &:last-of-type {
    border-bottom: none;
  }
`;

const IssuedInfoLabel = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  min-width: 110px;
`;

const IssuedInfoValue = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[800]};
  flex: 1;
  font-family: monospace;
  overflow-x: auto;
  white-space: nowrap;
`;

const InfoButton = styled.button`
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  background: white;
  cursor: pointer;
  ${({ theme }) => applyTypography(theme, "Body_4")};
`;

const ErrorMessage = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: #d32f2f;
  margin-bottom: 16px;
`;

const CheckCircle = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: white;
  border: 10px solid ${({ theme }) => theme.colors.bssmDarkBlue};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 60px;
  animation: ${popIn} 0.45s ease-out forwards, ${ringPulse} 0.8s ease-out 0.3s forwards;
  will-change: transform, box-shadow, opacity;
`;

const CheckIcon = styled.svg`
  width: 70px;
  height: 70px;
  fill: none;
  stroke: ${({ theme }) => theme.colors.bssmDarkBlue};
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transform-origin: center;
  animation: ${drawCheck} 0.5s ease-in-out 0.2s forwards, ${checkPop} 0.6s ease-out 0.2s forwards;
`;

const CompleteButton = styled.button`
  width: 200px;
  height: 56px;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  font-size: 20px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;
