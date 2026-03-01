"use client";

import { useEffect, useMemo, useState } from "react";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { useConfirm } from "@/hooks/useConfirm";
import { useUserQuery } from "@/app/user/queries";
import type { SignUpRequestItem } from "./api";
import {
  useApproveSignUpRequestMutation,
  useRejectSignUpRequestMutation,
  useSignUpRequestListQuery,
} from "./queries";
import { createSignUpRequestKey, isAdminRole, resolveRequestId } from "./model";
import {
  ActionButton,
  ActionRow,
  Card,
  CardHeader,
  CardList,
  Container,
  ContentWrapper,
  ErrorText,
  HeaderRow,
  MetaGrid,
  MetaLabel,
  MetaValue,
  Name,
  RefreshButton,
  StateBadge,
  StatusText,
  Subtitle,
  Title,
  TitleSection,
} from "./styles";

export default function SignUpRequestsPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [isClient, setIsClient] = useState(false);
  const { data: user, isLoading: isUserLoading } = useUserQuery(isClient);
  const isAdmin = isAdminRole(user?.role);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const {
    data: requestListData,
    isLoading: isListLoading,
    error: listError,
    refetch,
  } = useSignUpRequestListQuery({ size: 50 }, isClient && isAdmin);

  const approveMutation = useApproveSignUpRequestMutation();
  const rejectMutation = useRejectSignUpRequestMutation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const requests = useMemo(() => requestListData?.data.values ?? [], [requestListData]);

  const handleDecision = async (request: SignUpRequestItem, action: "approve" | "reject") => {
    const requestId = resolveRequestId(request);
    if (!requestId) {
      await confirm({
        title: "처리 실패",
        message: "회원가입 신청 ID를 찾을 수 없습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    const confirmed = await confirm({
      title: action === "approve" ? "회원가입 신청 승인" : "회원가입 신청 거절",
      message:
        action === "approve"
          ? `${request.name}님의 회원가입 신청을 승인할까요?`
          : `${request.name}님의 회원가입 신청을 거절할까요?`,
      confirmText: action === "approve" ? "승인" : "거절",
      cancelText: "취소",
    });

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(requestId);
      if (action === "approve") {
        await approveMutation.mutateAsync(requestId);
      } else {
        await rejectMutation.mutateAsync(requestId);
      }

      await confirm({
        title: "처리 완료",
        message: action === "approve" ? "승인되었습니다." : "거절되었습니다.",
        confirmText: "확인",
        hideCancel: true,
      });

      await refetch();
    } catch (decisionError) {
      const message = decisionError instanceof Error ? decisionError.message : "요청 처리에 실패했습니다.";
      await confirm({
        title: "처리 실패",
        message,
        confirmText: "확인",
        hideCancel: true,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!isClient || isUserLoading) {
    return (
      <Container>
        <DocsHeader title="회원가입 신청 관리" breadcrumb={["마이페이지"]} />
        <ContentWrapper>
          <StatusText>권한 정보를 확인하는 중입니다.</StatusText>
        </ContentWrapper>
        {ConfirmDialog}
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container>
        <DocsHeader title="회원가입 신청 관리" breadcrumb={["마이페이지"]} />
        <ContentWrapper>
          <Title>회원가입 신청 관리</Title>
          <Subtitle>관리자만 접근할 수 있는 메뉴입니다.</Subtitle>
        </ContentWrapper>
        {ConfirmDialog}
      </Container>
    );
  }

  return (
    <Container>
      <DocsHeader title="회원가입 신청 관리" breadcrumb={["마이페이지"]} />

      <ContentWrapper>
        <HeaderRow>
          <TitleSection>
            <Title>회원가입 신청 관리</Title>
            <Subtitle>신청 내역을 확인하고 승인 또는 거절할 수 있어요</Subtitle>
          </TitleSection>
          <RefreshButton type="button" onClick={() => void refetch()} disabled={isListLoading}>
            새로고침
          </RefreshButton>
        </HeaderRow>

        {isListLoading ? <StatusText>신청 목록을 불러오는 중입니다.</StatusText> : null}
        {listError ? (
          <ErrorText>
            {listError instanceof Error ? listError.message : "신청 목록을 불러오지 못했습니다."}
          </ErrorText>
        ) : null}

        {!isListLoading && !listError ? (
          requests.length > 0 ? (
            <CardList>
              {requests.map((request) => {
                const normalizedState = request.state.toUpperCase();
                const isPending = normalizedState === "PENDING";
                const requestId = resolveRequestId(request);
                const stableKey = createSignUpRequestKey(request);
                return (
                  <Card key={stableKey}>
                    <CardHeader>
                      <Name>{request.name}</Name>
                      <StateBadge state={normalizedState}>{normalizedState}</StateBadge>
                    </CardHeader>

                    <MetaGrid>
                      <MetaLabel>신청 ID</MetaLabel>
                      <MetaValue>{requestId ?? "-"}</MetaValue>
                      <MetaLabel>이메일</MetaLabel>
                      <MetaValue>{request.email || "-"}</MetaValue>
                      <MetaLabel>프로필</MetaLabel>
                      <MetaValue>{request.profile || "-"}</MetaValue>
                      <MetaLabel>신청 목적</MetaLabel>
                      <MetaValue>{request.purpose || "-"}</MetaValue>
                    </MetaGrid>

                    {isPending ? (
                      <ActionRow>
                        <ActionButton
                          type="button"
                          onClick={() => void handleDecision(request, "reject")}
                          disabled={requestId === null || processingId === requestId}
                        >
                          거절
                        </ActionButton>
                        <ActionButton
                          type="button"
                          primary
                          onClick={() => void handleDecision(request, "approve")}
                          disabled={requestId === null || processingId === requestId}
                        >
                          승인
                        </ActionButton>
                      </ActionRow>
                    ) : null}
                  </Card>
                );
              })}
            </CardList>
          ) : (
            <StatusText>회원가입 신청 내역이 없습니다.</StatusText>
          )
        ) : null}
      </ContentWrapper>

      {ConfirmDialog}
    </Container>
  );
}
