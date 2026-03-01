import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const ContentWrapper = styled.div`
  padding: 0 24px 24px;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
`;

export const TitleSection = styled.div``;

export const Title = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 10px;
`;

export const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
`;

export const RefreshButton = styled.button`
  height: 40px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: white;
  color: ${({ theme }) => theme.colors.grey[700]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 10px;
  padding: 14px;
  background: white;
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const Name = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  margin: 0;
  color: ${({ theme }) => theme.colors.grey[900]};
`;

export const StateBadge = styled.span<{ state: string }>`
  padding: 4px 10px;
  border-radius: 999px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  font-weight: 700;
  background: ${({ state }) => {
    if (state === "APPROVED") {
      return "#dcfce7";
    }
    if (state === "REJECTED") {
      return "#fee2e2";
    }
    return "#e0e7ff";
  }};
  color: ${({ state }) => {
    if (state === "APPROVED") {
      return "#166534";
    }
    if (state === "REJECTED") {
      return "#b91c1c";
    }
    return "#1d4ed8";
  }};
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  row-gap: 6px;
  column-gap: 10px;
`;

export const MetaLabel = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[600]};
  font-weight: 700;
`;

export const MetaValue = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[700]};
  white-space: pre-wrap;
  word-break: break-word;
`;

export const ActionRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const ActionButton = styled.button<{ primary?: boolean }>`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ primary }) => (primary ? "#16335c" : "#d1d5db")};
  background: ${({ primary }) => (primary ? "#16335c" : "white")};
  color: ${({ primary }) => (primary ? "white" : "#374151")};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const StatusText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 0;
`;

export const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: #d32f2f;
  margin: 0;
`;
