import { css, keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";

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

export const Container = styled.div<{ center?: boolean }>`
  display: flex;
  flex: 1;
  background: white;
  ${({ center }) => center && "justify-content: center; align-items: center;"}
  padding: 24px;
`;

export const FlexColumn = styled.div<{ center?: boolean; animated?: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ center }) => center && "align-items: center;"}
  width: 100%;
  max-width: 800px;
  ${({ animated }) => animated && css`
    animation: ${slideIn} 0.6s ease-out forwards;
  `}
`;

export const MainTitle = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  font-size: 32px;
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 32px;
  text-align: center;
`;

export const StyledInput = styled.input`
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

export const PrimaryButton = styled.button`
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const CheckCircle = styled.div`
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

export const CheckIcon = styled.svg`
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

export const StatusText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin-bottom: 16px;
`;

export const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: #d32f2f;
  margin-bottom: 16px;
`;
