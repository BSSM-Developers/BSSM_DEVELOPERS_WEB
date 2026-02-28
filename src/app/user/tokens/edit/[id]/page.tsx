"use client";

import { applyTypography } from "@/lib/themeHelper";
import { keyframes, css } from "@emotion/react";
import styled from "@emotion/styled";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, Suspense } from "react";

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

function TokenEditContent() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const initialStep = searchParams.get("step") as "NAME" | "ENDPOINT" | null;

  const [step, setStep] = useState<"NAME" | "ENDPOINT" | "SUCCESS">("NAME");
  const [name, setName] = useState("최애의 사인 추모관 조회");
  const [endpoint, setEndpoint] = useState("/get/chumoguahn");

  useEffect(() => {
    if (initialStep) {
      setStep(initialStep);
    }
  }, [initialStep]);

  const handleNext = useCallback(() => {
    setStep("SUCCESS");
  }, []);

  const handleComplete = useCallback(() => {
    router.push(`/user/tokens/${id}`);
  }, [router, id]);

  if (step === "SUCCESS") {
    return (
      <Container center>
        <FlexColumn center animated>
          <MainTitle>토큰 수정이 완료되었습니다!</MainTitle>
          <CheckCircle>
            <CheckIcon viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </CheckIcon>
          </CheckCircle>
          <PrimaryButton onClick={handleComplete}>완료</PrimaryButton>
        </FlexColumn>
      </Container>
    );
  }

  return (
    <Container center>
      <FlexColumn center animated>
        <MainTitle>
          {step === "NAME" ? "수정하고 싶은 이름을 입력해주세요" : "수정하고 싶은 엔드포인트를 입력해주세요"}
        </MainTitle>

        <StyledInput
          placeholder={step === "NAME" ? "이름을 입력해주세요" : "엔드포인트를 입력해주세요"}
          value={step === "NAME" ? name : endpoint}
          onChange={(e) => {
            if (step === "NAME") {
              setName(e.target.value);
            } else {
              setEndpoint(e.target.value);
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
          autoFocus
        />

        <PrimaryButton onClick={handleNext}>수정하기</PrimaryButton>
      </FlexColumn>
    </Container>
  );
}

export default function TokenEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TokenEditContent />
    </Suspense>
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

const MainTitle = styled.h2`
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

const PrimaryButton = styled.button`
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
