"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { useMemo, useCallback, useEffect, useState } from "react";
import { tokenApi, type ApiTokenListItem } from "./api";

export default function TokenListPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<ApiTokenListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleIssueToken = useCallback(() => {
    router.push("/user/tokens/issue");
  }, [router]);

  const handleManageToken = useCallback((id: string) => {
    router.push(`/user/tokens/${id}`);
  }, [router]);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setErrorMessage("");
        setIsLoading(true);
        const data = await tokenApi.getList();
        setTokens(data.values);
      } catch (error) {
        const message = error instanceof Error ? error.message : "토큰 목록을 불러오지 못했습니다.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };
    void loadTokens();
  }, []);

  const tokenListItems = useMemo(() => {
    return tokens.map((token) => (
      <TokenItem key={token.apiTokenId}>
        <TokenInfoSection>
          <TokenName>{token.apiTokenName}</TokenName>
          <TokenId>{token.apiTokenClientId}</TokenId>
        </TokenInfoSection>
        <ManageButton onClick={() => handleManageToken(String(token.apiTokenId))}>관리하기</ManageButton>
      </TokenItem>
    ));
  }, [handleManageToken, tokens]);

  return (
    <Container>
      <DocsHeader title="내 토큰 관리" breadcrumb={["마이페이지", "내 토큰 관리"]} />

      <ContentWrapper>
        <HeaderRow>
          <TitleSection>
            <Title>내 토큰 관리</Title>
            <Subtitle>내가 발급한 토큰을 관리하거나 새로 토큰을 발급 받을 수 있어요</Subtitle>
          </TitleSection>
          <IssueButton onClick={handleIssueToken}>신규 토큰 발급</IssueButton>
        </HeaderRow>

        {isLoading ? <StatusText>토큰 목록을 불러오는 중입니다.</StatusText> : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
        {!isLoading && !errorMessage ? <TokenList>{tokenListItems}</TokenList> : null}
      </ContentWrapper>
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

const IssueButton = styled.button`
  padding: 12px 24px;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  cursor: pointer;
  border: none;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(1.1);
  }
`;

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 24px;
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

const TokenItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

const TokenInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TokenName = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  font-size: 20px;
  color: ${({ theme }) => theme.colors.grey[900]};
`;

const TokenId = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_3")};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const ManageButton = styled.button`
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.grey[900]};
  color: white;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;
