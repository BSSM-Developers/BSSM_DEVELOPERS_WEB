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

type IssueStep = "NAME" | "DOMAIN" | "SUCCESS";

const parseDomains = (value: string): string[] => {
  const parts = value
    .split(/[\n,]/)
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0);

  return Array.from(new Set(parts));
};

export default function TokenIssuePage() {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [step, setStep] = useState<IssueStep>("NAME");
  const [name, setName] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedToken, setIssuedToken] = useState<ApiTokenWithSecret | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const domains = parseDomains(domainInput);

  const handleIssue = useCallback(async () => {
    if (!name.trim() || isSubmitting) {
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);
      const createdToken = await tokenApi.create(name.trim(), domains);
      setIssuedToken(createdToken);
      setStep("SUCCESS");
    } catch (error) {
      const message = error instanceof Error ? error.message : "토큰 발급에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [domains, isSubmitting, name]);

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
      hideCancel: true,
    });
  }, [confirm]);

  if (step === "SUCCESS") {
    return (
      <Container center>
        <FlexColumn center animated>
          <SuccessTitle>토큰 발급이 완료되었습니다!</SuccessTitle>
          <SecretNotice>
            시크릿 키는 지금 화면에서만 확인할 수 있습니다. 복사해서 안전한 곳에 보관해주세요.
          </SecretNotice>
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
                <PrimaryInfoButton onClick={() => void handleCopy(issuedToken.secretKey)}>시크릿 키 복사</PrimaryInfoButton>
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
        {step === "NAME" ? (
          <>
            <InputTitle>신규 발급 받을 토큰 이름을 입력해주세요</InputTitle>
            <StyledInput
              placeholder="토큰 이름을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("DOMAIN")}
              autoFocus
            />
            <IssueButton onClick={() => setStep("DOMAIN")} disabled={!name.trim() || isSubmitting}>
              다음
            </IssueButton>
          </>
        ) : (
          <>
            <InputTitle>도메인을 입력해주세요 (선택)</InputTitle>
            <DomainDescription>쉼표(,) 또는 줄바꿈으로 여러 도메인을 입력할 수 있습니다.</DomainDescription>
            <DomainTextarea
              placeholder={"예: bssm-dev.com, app.bssm-dev.com"}
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              autoFocus
            />
            {domains.length > 0 ? (
              <DomainList>
                {domains.map((domain) => (
                  <DomainChip key={domain}>{domain}</DomainChip>
                ))}
              </DomainList>
            ) : null}
            <ButtonRow>
              <SkipButton onClick={() => void handleIssue()} disabled={isSubmitting}>
                {isSubmitting ? "발급 중..." : "건너뛰기"}
              </SkipButton>
              <IssueButton onClick={() => void handleIssue()} disabled={isSubmitting}>
                {isSubmitting ? "발급 중..." : "발급받기"}
              </IssueButton>
            </ButtonRow>
            <BackButton onClick={() => setStep("NAME")} disabled={isSubmitting}>
              이전
            </BackButton>
          </>
        )}
        {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}
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
  margin-bottom: 40px;
  outline: none;
  color: ${({ theme }) => theme.colors.grey[900]};

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[400]};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

const DomainTextarea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 16px 24px;
  border: 1px solid ${({ theme }) => theme.colors.grey[100]};
  border-radius: 4px;
  background-color: white;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  margin-bottom: 16px;
  outline: none;
  color: ${({ theme }) => theme.colors.grey[900]};
  resize: vertical;

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[400]};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

const DomainDescription = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin-bottom: 16px;
`;

const DomainList = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`;

const DomainChip = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.grey[100]};
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 13px;
`;

const ButtonRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 10px;
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

const SkipButton = styled(IssueButton)`
  background: white;
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
`;

const BackButton = styled.button`
  margin-top: 14px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.grey[500]};
  cursor: pointer;
  ${({ theme }) => applyTypography(theme, "Body_4")};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessTitle = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  font-size: 32px;
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 16px;
  text-align: center;
`;

const SecretNotice = styled.div`
  width: 100%;
  max-width: 800px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  background: ${({ theme }) => theme.colors.grey[50]};
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 22px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[700]};
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
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
  cursor: pointer;
  ${({ theme }) => applyTypography(theme, "Body_4")};
`;

const PrimaryInfoButton = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.bssmDarkBlue};
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
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
