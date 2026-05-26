"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useUnblockRequestsQuery } from "../queries";

export default function UnblockRequestsPage() {
  const unblockRequestsQuery = useUnblockRequestsQuery();
  const unblockRequests = unblockRequestsQuery.data?.values ?? [];
  const isLoading = unblockRequestsQuery.isLoading;
  const errorMessage = unblockRequestsQuery.error instanceof Error ? unblockRequestsQuery.error.message : "";

  return (
    <Container>
      <DocsHeader title="차단 해제 요청 내역" breadcrumb={["마이페이지", "내 토큰 관리"]} />

      <ContentWrapper>
        <HeaderRow>
          <TitleSection>
            <Title>차단 해제 요청 내역</Title>
            <Subtitle>내가 신청한 토큰 차단 해제 요청의 상태를 확인할 수 있어요</Subtitle>
          </TitleSection>
        </HeaderRow>

        {isLoading ? <BsdevLoader label="차단 해제 요청 내역을 불러오는 중입니다..." size={52} minHeight="140px" /> : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
        {!isLoading && !errorMessage ? (
          unblockRequests.length > 0 ? (
            <RequestList>
              {unblockRequests.map((request) => (
                <RequestItem key={request.requestId}>
                  <RequestHeader>
                    <RequestId>요청 ID #{request.requestId}</RequestId>
                    <RequestState state={request.state}>{request.state}</RequestState>
                  </RequestHeader>
                  <RequestInfo>
                    <RequestTokenName>토큰: {request.apiTokenName}</RequestTokenName>
                    <RequestDate>신청일: {new Date(request.createdAt).toLocaleDateString()}</RequestDate>
                  </RequestInfo>
                </RequestItem>
              ))}
            </RequestList>
          ) : (
            <StatusText>차단 해제 요청 내역이 없습니다.</StatusText>
          )
        ) : null}
      </ContentWrapper>
    </Container>
  );
}

import { BsdevLoader } from "@/components/common/BsdevLoader";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ContentWrapper = styled.div`
  padding: 0 24px 24px 24px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
`;

const TitleSection = styled.div``;

const Title = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const StatusText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  padding: 0 24px;
`;

const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: #d32f2f;
  padding: 0 24px;
`;

const RequestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
`;

const RequestItem = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 8px;
  padding: 12px 14px;
  background: white;
`;

const RequestHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
`;

const RequestId = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[700]};
  font-weight: 700;
`;

const RequestState = styled.span<{ state: string }>`
  padding: 4px 10px;
  border-radius: 999px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  font-weight: 700;
  background: ${({ state }) => {
    const normalized = state.toUpperCase();
    if (normalized === "APPROVED") {
      return "#dcfce7";
    }
    if (normalized === "REJECTED") {
      return "#fee2e2";
    }
    return "#e0e7ff";
  }};
  color: ${({ state }) => {
    const normalized = state.toUpperCase();
    if (normalized === "APPROVED") {
      return "#166534";
    }
    if (normalized === "REJECTED") {
      return "#b91c1c";
    }
    return "#1d4ed8";
  }};
`;

const RequestInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RequestTokenName = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const RequestDate = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.grey[400]};
`;