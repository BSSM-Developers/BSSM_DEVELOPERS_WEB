import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 69px);
  background-color: white;
  padding: 48px 24px;
`;

export const Content = styled.div`
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
`;

export const HeaderSection = styled.div`
  margin-bottom: 28px;
`;

export const Title = styled.h1`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 12px;
`;

export const Description = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
`;

export const PanelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const PanelBase = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 14px;
  background: white;
  padding: 20px;
`;

export const InfoPanel = styled(PanelBase)`
  min-height: 360px;
`;

export const FormPanel = styled(PanelBase)`
  min-height: 360px;
`;

export const PanelTitle = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0 0 18px 0;
`;

export const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const FieldRow = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 10px;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.grey[50]};
`;

export const FieldLabel = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[600]};
  margin: 0 0 4px 0;
`;

export const FieldValue = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0;
  word-break: break-word;
`;

export const StateBadge = styled.span<{ state: string }>`
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
  background: ${({ state }) => {
    if (state === "APPROVED") {
      return "#dcfce7";
    }
    if (state === "REJECTED") {
      return "#fee2e2";
    }
    if (state === "PENDING") {
      return "#e0e7ff";
    }
    return "#f3f4f6";
  }};
  color: ${({ state }) => {
    if (state === "APPROVED") {
      return "#166534";
    }
    if (state === "REJECTED") {
      return "#b91c1c";
    }
    if (state === "PENDING") {
      return "#1d4ed8";
    }
    return "#4b5563";
  }};
`;

export const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const SubmitButton = styled.button`
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

export const FormCard = styled.section`
  width: 100%;
  max-width: 760px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 16px;
  background: white;
  padding: 28px 24px;
`;

export const SingleForm = styled.form`
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 96px;
`;

export const StatusCard = styled.section`
  width: 100%;
  max-width: 760px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 16px;
  background: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const StatusItem = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.grey[50]};
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const StatusItemLabel = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[600]};
  margin: 0;
`;

export const StatusItemValue = styled.div`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0;
  word-break: break-word;
`;

export const ActionButton = styled.button`
  height: 44px;
  padding: 0 18px;
  width: fit-content;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: white;
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
  ${({ theme }) => applyTypography(theme, "Body_3")};
  font-weight: 700;
  cursor: pointer;
`;

export const EmptyMessage = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[600]};
  margin: 0;
`;

export const RetryButton = styled.button`
  height: 44px;
  padding: 0 18px;
  width: fit-content;
  border-radius: 10px;
  border: none;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  ${({ theme }) => applyTypography(theme, "Body_3")};
  font-weight: 700;
  cursor: pointer;
`;

export const FormOnlyCenter = styled.div`
  width: 100%;
  min-height: calc(100vh - 69px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const FormOnlyWrap = styled.div`
  width: 100%;
  max-width: 1080px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 64px;
  transform: translateY(-32px);
`;

export const FormOnlyHeading = styled.h1`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  text-align: center;
`;

const popIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  60% {
    opacity: 1;
    transform: scale(1.06);
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

const drawCheck = keyframes`
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
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

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const CelebrationContainer = styled.div`
  min-height: calc(100vh - 69px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 20%, rgba(22, 51, 92, 0.1), transparent 55%),
    radial-gradient(circle at 80% 30%, rgba(22, 51, 92, 0.08), transparent 60%),
    #ffffff;
  padding: 24px;
`;

export const CelebrateCard = styled.section`
  width: 100%;
  max-width: 520px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 20px;
  background: white;
  box-shadow: 0 22px 38px rgba(15, 23, 42, 0.08);
  padding: 36px 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeUp} 0.45s ease-out forwards;
`;

export const CheckCircle = styled.div`
  width: 130px;
  height: 130px;
  border-radius: 50%;
  border: 10px solid ${({ theme }) => theme.colors.bssmDarkBlue};
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  animation: ${popIn} 0.45s ease-out forwards, ${ringPulse} 0.85s ease-out 0.35s forwards;
  will-change: transform, box-shadow, opacity;
`;

export const CheckIcon = styled.svg`
  width: 68px;
  height: 68px;
  fill: none;
  stroke: ${({ theme }) => theme.colors.bssmDarkBlue};
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: ${drawCheck} 0.55s ease-in-out 0.2s forwards, ${checkPop} 0.65s ease-out 0.2s forwards;
`;

export const CelebrateTitle = styled.h1`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0 0 10px 0;
  text-align: center;
`;

export const CelebrateDescription = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 0;
  text-align: center;
`;
