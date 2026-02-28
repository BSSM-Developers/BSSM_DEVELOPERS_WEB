"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { useConfirm } from "@/hooks/useConfirm";

interface ApiPermission {
  id: string;
  name: string;
  endpoint: string;
  method: string;
}

const MOCK_PERMISSIONS: ApiPermission[] = [
  { id: "1", name: "최애의 사인 추모관 조회", endpoint: "/get/chumoguahn", method: "GET" },
  { id: "2", name: "최애의 사인 추모관 조회", endpoint: "/get/chumoguahn", method: "GET" },
  { id: "3", name: "최애의 사인 추모관 조회", endpoint: "/get/chumoguahn", method: "GET" },
  { id: "4", name: "최애의 사인 추모관 조회", endpoint: "/get/chumoguahn", method: "GET" },
  { id: "5", name: "최애의 사인 추모관 조회", endpoint: "/get/chumoguahn", method: "GET" },
  { id: "6", name: "최애의 사인 추모관 조회", endpoint: "/get/chumoguahn", method: "GET" },
];

export default function TokenDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [tokenName, setTokenName] = useState("test_api_key1");
  const secretKey = "test_ck_5OWRapdA8dmPpQlA09gX3o1zeQZK";

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    await confirm({
      title: "복사가 완료되었습니다",
      message: "클립보드에 복사되었습니다.",
      confirmText: "확인",
    });
  }, [confirm]);

  const handleReissue = useCallback(async () => {
    const isConfirmed = await confirm({
      title: "시크릿 키 재발급",
      message: "시크릿 키를 재발급 받으시겠습니까?",
      confirmText: "재발급",
      cancelText: "취소",
    });

    if (isConfirmed) {
      await confirm({
        title: "재발급 완료",
        message: "시크릿 키가 성공적으로 재발급되었습니다.",
        confirmText: "확인",
      });
    }
  }, [confirm]);

  const handleBack = useCallback(() => {
    router.push("/user/tokens");
  }, [router]);

  const permissionItems = useMemo(() => {
    return MOCK_PERMISSIONS.map((api, index) => (
      <ApiItem key={index}>
        <ApiInfo>
          <ApiName>{api.name}</ApiName>
          <ApiMethod>API METHOD: {api.method}</ApiMethod>
        </ApiInfo>
        <ApiEndpointSection>
          <Label>엔드포인트</Label>
          <EndpointValue>{api.endpoint}</EndpointValue>
        </ApiEndpointSection>
        <ActionGroup>
          <TinyButton primary onClick={() => router.push(`/user/tokens/edit/${id}?step=ENDPOINT`)}>수정</TinyButton>
          <TinyButton onClick={() => handleCopy(api.endpoint)}>복사</TinyButton>
        </ActionGroup>
      </ApiItem>
    ));
  }, [handleCopy, id, router]);

  return (
    <Container>
      <DocsHeader title={tokenName} breadcrumb={["마이페이지", "내 토큰 관리"]} />

      <ContentWrapper>
        <HeaderRow>
          <TitleSection>
            <Title>{tokenName}</Title>
            <Subtitle>내 토큰을 관리할 수 있어요</Subtitle>
          </TitleSection>
          <HeaderActions>
            <HeaderButton onClick={() => router.push(`/user/tokens/edit/${id}?step=NAME`)}>이름 수정</HeaderButton>
            <HeaderButton primary onClick={handleReissue}>시크릿 키 재발급</HeaderButton>
          </HeaderActions>
        </HeaderRow>

        <Section>
          <SectionTitle>토큰</SectionTitle>
          <SectionSubtitle>발급 받은 토큰을 통해 다양한 API들을 사용할 수 있습니다</SectionSubtitle>

          <TokenRow>
            <Label>시크릿 키</Label>
            <TokenValue>{secretKey}</TokenValue>
            <TinyButton onClick={() => handleCopy(secretKey)}>복사</TinyButton>
          </TokenRow>
        </Section>

        <ApiListSection>
          {permissionItems}
        </ApiListSection>
      </ContentWrapper>
      {ConfirmDialog}
    </Container>
  );
}

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
  margin-bottom: 48px;
`;

const TitleSection = styled.div``;

const Title = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const HeaderActions = styled.div`
    display: flex;
    gap: 12px;
`;

const HeaderButton = styled.button<{ primary?: boolean }>`
    padding: 12px 32px;
    border-radius: 4px;
    ${({ theme }) => applyTypography(theme, "Body_4")};
    cursor: pointer;
    border: 1px solid ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : theme.colors.grey[200]};
    background: ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : "white"};
    color: ${({ theme, primary }) => primary ? "white" : theme.colors.grey[900]};
    transition: filter 0.2s;

    &:hover {
        filter: brightness(0.95);
    }
`;

const Section = styled.div`
    margin-bottom: 48px;
`;

const SectionTitle = styled.h3`
    ${({ theme }) => applyTypography(theme, "Headline_1")};
    font-size: 32px;
    color: ${({ theme }) => theme.colors.grey[900]};
    margin-bottom: 8px;
`;

const SectionSubtitle = styled.p`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: ${({ theme }) => theme.colors.grey[400]};
    margin-bottom: 24px;
`;

const TokenRow = styled.div`
    display: flex;
    align-items: center;
    gap: 60px;
`;

const Label = styled.span`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: ${({ theme }) => theme.colors.grey[900]};
    min-width: 60px;
`;

const TokenValue = styled.span`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: ${({ theme }) => theme.colors.grey[600]};
    flex: 1;
    font-family: monospace;
`;

const TinyButton = styled.button<{ primary?: boolean }>`
    padding: 6px 16px;
    border-radius: 4px;
    ${({ theme }) => applyTypography(theme, "Body_4")};
    font-size: 11px;
    cursor: pointer;
    border: 1px solid ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : theme.colors.grey[200]};
    background: ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : "white"};
    color: ${({ theme, primary }) => primary ? "white" : theme.colors.grey[900]};
`;

const ApiListSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const ApiItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const ApiInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 250px;
`;

const ApiName = styled.h4`
    ${({ theme }) => applyTypography(theme, "Headline_2")};
    font-size: 20px;
    color: ${({ theme }) => theme.colors.grey[900]};
`;

const ApiMethod = styled.span`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    font-size: 11px;
    color: ${({ theme }) => theme.colors.grey[400]};
`;

const ApiEndpointSection = styled.div`
    display: flex;
    align-items: center;
    gap: 60px;
    flex: 1;
`;

const EndpointValue = styled.span`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: ${({ theme }) => theme.colors.grey[600]};
`;

const ActionGroup = styled.div`
    display: flex;
    gap: 8px;
`;
