"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMyProfileQuery, useUpdatePurposeMutation } from "@/app/sign-up/queries";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { useConfirm } from "@/hooks/useConfirm";
import { getStateLabel, resolveSignUpRequestId } from "./model";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import {
  CelebrateCard,
  CelebrateDescription,
  CelebrateTitle,
  CelebrationContainer,
  CheckCircle,
  CheckIcon,
  Container,
  Content,
  Description,
  FieldLabel,
  FieldList,
  FieldRow,
  FieldValue,
  Form,
  FormPanel,
  HeaderSection,
  InfoPanel,
  PanelGrid,
  PanelTitle,
  StateBadge,
  SubmitButton,
  Title,
} from "./styles";
import { useApprovedSignUpFlow } from "./useApprovedSignUpFlow";

export default function SignUpPage() {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const [showApprovedCelebration, setShowApprovedCelebration] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();
  const { data: profileData, isLoading, isError, error } = useMyProfileQuery();
  const updatePurposeMutation = useUpdatePurposeMutation();

  const status = profileData?.state || "NONE";

  useApprovedSignUpFlow({
    profileData,
    router,
    setPurpose,
    setShowApprovedCelebration,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await updatePurposeMutation.mutateAsync({ id: signupRequestId, purpose: purpose.trim() });
      await confirm({
        title: "신청 완료",
        message: "신청이 제출되었습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "신청 제출에 실패했습니다.";
      await confirm({
        title: "신청 실패",
        message,
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
    const message = error instanceof Error ? error.message : "신청 정보를 불러오지 못했습니다.";
    return (
      <Container>
        <Title>회원가입 신청</Title>
        <Description>{message}</Description>
        {ConfirmDialog}
      </Container>
    );
  }

  if (status === "APPROVED" && showApprovedCelebration) {
    return (
      <CelebrationContainer>
        <CelebrateCard>
          <CheckCircle>
            <CheckIcon viewBox="0 0 52 52" aria-hidden="true">
              <path d="M14 27 L23 36 L38 18" />
            </CheckIcon>
          </CheckCircle>
          <CelebrateTitle>가입을 축하드립니다!</CelebrateTitle>
          <CelebrateDescription>승인이 완료되었습니다. 잠시 후 이동합니다.</CelebrateDescription>
        </CelebrateCard>
        {ConfirmDialog}
      </CelebrationContainer>
    );
  }

  return (
    <Container>
      <Content>
        <HeaderSection>
          <Title>회원가입 신청</Title>
          <Description>회원가입 신청 정보를 확인하고 목적을 제출해주세요.</Description>
        </HeaderSection>

        <PanelGrid>
          <InfoPanel>
            <PanelTitle>신청자 정보</PanelTitle>
            <FieldList>
              <FieldRow>
                <FieldLabel>이름</FieldLabel>
                <FieldValue>{profileData?.name || "-"}</FieldValue>
              </FieldRow>
              <FieldRow>
                <FieldLabel>이메일</FieldLabel>
                <FieldValue>{profileData?.email || "-"}</FieldValue>
              </FieldRow>
              <FieldRow>
                <FieldLabel>프로필</FieldLabel>
                <FieldValue>{profileData?.profile || "-"}</FieldValue>
              </FieldRow>
              <FieldRow>
                <FieldLabel>신청 상태</FieldLabel>
                <StateBadge state={status}>{getStateLabel(status)}</StateBadge>
              </FieldRow>
            </FieldList>
          </InfoPanel>

          <FormPanel>
            <PanelTitle>신청 목적</PanelTitle>
            <Form onSubmit={handleSubmit}>
              <FloatingInput
                label="신청 목적"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
              <SubmitButton type="submit" disabled={updatePurposeMutation.isPending}>
                {updatePurposeMutation.isPending ? "제출 중..." : "신청하기"}
              </SubmitButton>
            </Form>
          </FormPanel>
        </PanelGrid>
      </Content>
      {ConfirmDialog}
    </Container>
  );
}
