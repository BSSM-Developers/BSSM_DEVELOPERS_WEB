"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import { tokenApi, type ApiTokenDetail, type ApiTokenState } from "../api";

const parseTokenId = (value: string | string[] | undefined): number | null => {
  if (!value) {
    return null;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function TokenDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const tokenId = parseTokenId(id);
  const [tokenDetail, setTokenDetail] = useState<ApiTokenDetail | null>(null);
  const [reissuedSecretKey, setReissuedSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadTokenDetail = async () => {
      if (tokenId === null) {
        setErrorMessage("유효하지 않은 토큰 ID입니다.");
        setIsLoading(false);
        return;
      }
      try {
        setErrorMessage("");
        setIsLoading(true);
        const detail = await tokenApi.getDetail(tokenId);
        setTokenDetail(detail);
      } catch (error) {
        const message = error instanceof Error ? error.message : "토큰 상세 정보를 불러오지 못했습니다.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };
    void loadTokenDetail();
  }, [tokenId]);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    await confirm({
      title: "복사가 완료되었습니다",
      message: "클립보드에 복사되었습니다.",
      confirmText: "확인",
      hideCancel: true,
    });
  }, [confirm]);

  const handleReissue = useCallback(async () => {
    if (tokenId === null) {
      return;
    }
    const isConfirmed = await confirm({
      title: "시크릿 키 재발급",
      message: "시크릿 키를 재발급 받으시겠습니까?",
      confirmText: "재발급",
      cancelText: "취소",
    });

    if (isConfirmed) {
      try {
        const reissued = await tokenApi.reissueSecret(tokenId);
        setReissuedSecretKey(reissued.secretKey);
        const refreshed = await tokenApi.getDetail(tokenId);
        setTokenDetail(refreshed);
      } catch (error) {
        const message = error instanceof Error ? error.message : "시크릿 키 재발급에 실패했습니다.";
        await confirm({
          title: "재발급 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }
      await confirm({
        title: "재발급 완료",
        message: "시크릿 키가 성공적으로 재발급되었습니다. 아래에 표시된 키를 복사해 보관해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
    }
  }, [confirm, tokenId]);

  const permissionItems = useMemo(() => {
    if (!tokenDetail) {
      return null;
    }
    return tokenDetail.registeredApis.map((apiUsage) => {
      const apiIdentifier = String(apiUsage.apiId);
      return (
      <ApiItem key={apiIdentifier}>
        <ApiInfo>
          <ApiName>{apiUsage.name}</ApiName>
          <ApiMethod>API METHOD: {apiUsage.apiMethod}</ApiMethod>
        </ApiInfo>
        <ApiEndpointSection>
          <Label>엔드포인트</Label>
          <EndpointValue>{apiUsage.endpoint}</EndpointValue>
        </ApiEndpointSection>
        <ActionGroup>
          <TinyButton primary onClick={() => router.push(`/user/tokens/edit/${tokenDetail.apiTokenId}?step=USAGE_NAME&apiId=${apiIdentifier}`)}>이름 수정</TinyButton>
          <TinyButton primary onClick={() => router.push(`/user/tokens/edit/${tokenDetail.apiTokenId}?step=ENDPOINT&apiId=${apiIdentifier}`)}>주소 수정</TinyButton>
          <TinyButton onClick={() => void handleCopy(apiUsage.endpoint)}>복사</TinyButton>
        </ActionGroup>
      </ApiItem>
      );
    });
  }, [handleCopy, router, tokenDetail]);

  const tokenName = tokenDetail?.apiTokenName ?? "토큰 상세";

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
            <HeaderButton onClick={() => router.push(`/user/tokens/edit/${tokenId ?? ""}?step=TOKEN_NAME`)} disabled={tokenId === null || isLoading || !!errorMessage}>
              이름 수정
            </HeaderButton>
            <HeaderButton primary onClick={() => void handleReissue()} disabled={tokenId === null || isLoading || !!errorMessage}>
              시크릿 키 재발급
            </HeaderButton>
          </HeaderActions>
        </HeaderRow>

        {isLoading ? <StatusText>토큰 정보를 불러오는 중입니다.</StatusText> : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

        <Section>
          <SectionTitle>토큰</SectionTitle>
          <SectionSubtitle>발급 받은 토큰 정보를 확인하고 시크릿 키를 재발급할 수 있습니다</SectionSubtitle>

          <TokenRow>
            <Label>클라이언트 ID</Label>
            <TokenValue>{tokenDetail?.apiTokenClientId ?? "-"}</TokenValue>
            <TinyButton onClick={() => tokenDetail ? void handleCopy(tokenDetail.apiTokenClientId) : undefined} disabled={!tokenDetail}>
              복사
            </TinyButton>
          </TokenRow>
          <TokenRow>
            <Label>상태</Label>
            <TokenStateBadge state={tokenDetail?.state ?? "NORMAL"}>
              {tokenDetail?.state ?? "NORMAL"}
            </TokenStateBadge>
          </TokenRow>
          <SecretKeyNotice>
            시크릿 키는 토큰 생성 직후에만 확인할 수 있습니다. 분실 시 시크릿 키 재발급 버튼으로 새 키를 발급받아 다시 보관해주세요.
          </SecretKeyNotice>
          {reissuedSecretKey ? (
            <TokenRow>
              <Label>재발급 시크릿 키</Label>
              <SecretValue>{reissuedSecretKey}</SecretValue>
              <TinyButton onClick={() => void handleCopy(reissuedSecretKey)}>복사</TinyButton>
            </TokenRow>
          ) : null}
        </Section>

        {!isLoading && !errorMessage ? (
          <ApiListSection>
            {permissionItems}
          </ApiListSection>
        ) : null}
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

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
    margin-bottom: 14px;
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

const TokenStateBadge = styled.span<{ state: ApiTokenState }>`
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    ${({ theme }) => applyTypography(theme, "Body_4")};
    font-size: 12px;
    font-weight: 700;
    background: ${({ state }) => {
      if (state === "BLOCKED") {
        return "#FEE2E2";
      }
      if (state === "WARNING") {
        return "#FEF3C7";
      }
      return "#DCFCE7";
    }};
    color: ${({ state }) => {
      if (state === "BLOCKED") {
        return "#B91C1C";
      }
      if (state === "WARNING") {
        return "#B45309";
      }
      return "#166534";
    }};
`;

const SecretValue = styled.span`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: ${({ theme }) => theme.colors.bssmDarkBlue};
    flex: 1;
    font-family: monospace;
    font-weight: 600;
`;

const TinyButton = styled.button<{ primary?: boolean }>`
    padding: 6px 16px;
    border-radius: 4px;
    ${({ theme }) => applyTypography(theme, "Body_4")};
    font-size: 11px;
    cursor: pointer;
    border: 1px solid ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : theme.colors.grey[200]};
    background: ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : "white"};
    color: ${({ theme, primary }) => primary ? "white" : theme.colors.bssmDarkBlue} !important;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
`;

const ApiListSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const SecretKeyNotice = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.grey[200]};
    background: ${({ theme }) => theme.colors.grey[50]};
    border-radius: 8px;
    padding: 12px 14px;
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: ${({ theme }) => theme.colors.grey[700]};
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

const StatusText = styled.p`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: ${({ theme }) => theme.colors.grey[500]};
    margin-bottom: 16px;
`;

const ErrorText = styled.p`
    ${({ theme }) => applyTypography(theme, "Body_4")};
    color: #d32f2f;
    margin-bottom: 16px;
`;
