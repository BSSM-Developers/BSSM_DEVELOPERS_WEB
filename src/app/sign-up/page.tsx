"use client";

import { useEffect, useMemo, useState } from "react";
import { useMyProfileQuery, useUpdatePurposeMutation } from "@/app/sign-up/queries";
import { SingleInputActionForm } from "@/components/common/SingleInputActionForm";
import { useConfirm } from "@/hooks/useConfirm";
import { getStateLabel, resolveSignUpRequestId } from "./model";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import {
  ActionButton,
  CelebrateCard,
  CelebrateDescription,
  CelebrateTitle,
  CelebrationContainer,
  CheckCircle,
  CheckIcon,
  Container,
  Content,
  EmptyMessage,
  FormCard,
  Description,
  HeaderSection,
  FormOnlyCenter,
  RetryButton,
  StateBadge,
  StatusCard,
  StatusItem,
  StatusItemLabel,
  StatusItemValue,
  Title,
} from "./styles";

type SignUpViewMode = "form" | "status" | "success";

export default function SignUpPage() {
  const [purpose, setPurpose] = useState("");
  const [viewMode, setViewMode] = useState<SignUpViewMode>("form");
  const [hasShownLoadError, setHasShownLoadError] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();
  const { data: profileData, isLoading, isError, refetch } = useMyProfileQuery();
  const updatePurposeMutation = useUpdatePurposeMutation();

  const status = profileData?.state ?? "NONE";
  const hasPurpose = useMemo(() => (profileData?.purpose ?? "").trim().length > 0, [profileData?.purpose]);

  useEffect(() => {
    if (!profileData || viewMode === "success") {
      return;
    }

    if (hasPurpose) {
      setPurpose(profileData.purpose ?? "");
      setViewMode("status");
      return;
    }

    setPurpose("");
    setViewMode("form");
  }, [profileData, hasPurpose, viewMode]);

  useEffect(() => {
    if (!isError || hasShownLoadError) {
      return;
    }

    setHasShownLoadError(true);
    void confirm({
      title: "불러오기 실패",
      message: "회원가입 신청 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      confirmText: "확인",
      hideCancel: true,
    });
  }, [confirm, hasShownLoadError, isError]);

  useEffect(() => {
    if (!isError && hasShownLoadError) {
      setHasShownLoadError(false);
    }
  }, [hasShownLoadError, isError]);

  useEffect(() => {
    if (viewMode !== "success") {
      return;
    }

    const timer = setTimeout(() => {
      setViewMode("status");
      void refetch();
    }, 1500);

    return () => clearTimeout(timer);
  }, [refetch, viewMode]);

  const handleSubmit = async () => {
    if (!purpose.trim()) {
      await confirm({
        title: "입력 필요",
        message: "신청 목적을 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    const signupRequestId = resolveSignUpRequestId(profileData);
    if (!signupRequestId) {
      await confirm({
        title: "요청 실패",
        message: "신청서 ID를 찾을 수 없습니다. 다시 로그인 후 시도해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    try {
      const trimmedPurpose = purpose.trim();
      await updatePurposeMutation.mutateAsync({ id: signupRequestId, purpose: trimmedPurpose });
      setPurpose(trimmedPurpose);
      setViewMode("success");
    } catch {
      await confirm({
        title: "신청 실패",
        message: "신청 목적 제출에 실패했습니다. 다시 시도해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Container>
        <BsdevLoader label="신청 정보를 불러오는 중입니다..." fullScreen />
        {ConfirmDialog}
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <Content>
          <HeaderSection>
            <Title>회원가입 신청</Title>
            <Description>잠시 후 다시 시도해주세요.</Description>
          </HeaderSection>
          <FormCard>
            <EmptyMessage>회원가입 신청 정보를 불러오지 못했습니다.</EmptyMessage>
            <RetryButton type="button" onClick={() => void refetch()}>
              다시 시도
            </RetryButton>
          </FormCard>
        </Content>
        {ConfirmDialog}
      </Container>
    );
  }

  if (viewMode === "success") {
    return (
      <CelebrationContainer>
        <CelebrateCard>
          <CheckCircle>
            <CheckIcon viewBox="0 0 52 52" aria-hidden="true">
              <path d="M14 27 L23 36 L38 18" />
            </CheckIcon>
          </CheckCircle>
          <CelebrateTitle>수정 완료</CelebrateTitle>
          <CelebrateDescription>신청 목적이 저장되었습니다.</CelebrateDescription>
        </CelebrateCard>
        {ConfirmDialog}
      </CelebrationContainer>
    );
  }

  if (viewMode === "form") {
    return (
      <Container>
        <FormOnlyCenter>
          <SingleInputActionForm
            title="회원가입 신청 목적을 입력해주세요"
            subtitle="BSSM Developers는 학생들의 안전한 API 관리를 위해 외부 사용자의 접근을 제한하고 있습니다."
            label="신청 목적"
            value={purpose}
            onChange={setPurpose}
            onSubmit={() => void handleSubmit()}
            submitText="신청하기"
            submittingText="제출 중..."
            isSubmitting={updatePurposeMutation.isPending}
          />
        </FormOnlyCenter>
        {ConfirmDialog}
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        <HeaderSection>
          <Title>신청 현황</Title>
          <Description>회원가입 신청 상태를 확인할 수 있습니다.</Description>
        </HeaderSection>
        <StatusCard>
          <StatusItem>
            <StatusItemLabel>신청 상태</StatusItemLabel>
            <StatusItemValue>
              <StateBadge state={status}>{getStateLabel(status)}</StateBadge>
            </StatusItemValue>
          </StatusItem>
          <StatusItem>
            <StatusItemLabel>신청 목적</StatusItemLabel>
            <StatusItemValue>{profileData?.purpose?.trim() || "-"}</StatusItemValue>
          </StatusItem>
          <ActionButton type="button" onClick={() => setViewMode("form")}>
            신청 목적 수정
          </ActionButton>
        </StatusCard>
      </Content>
      {ConfirmDialog}
    </Container>
  );
}
