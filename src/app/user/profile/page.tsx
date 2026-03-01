"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useUserQuery } from "../queries";
import { FloatingInput } from "@/components/ui/FloatingInput";
import Link from "next/link";
import { useMemo } from "react";
import { useSignUpRequestListQuery } from "@/app/user/sign-up-requests/queries";

export default function ProfilePage() {
  const { data: user, isLoading } = useUserQuery();
  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";
  const {
    data: signUpRequestsData,
    isLoading: isSignUpRequestsLoading,
    error: signUpRequestsError,
  } = useSignUpRequestListQuery({ size: 50 }, Boolean(isAdmin));

  const pendingCount = useMemo(() => {
    if (!signUpRequestsData) {
      return 0;
    }
    return signUpRequestsData.data.values.filter((request) => request.state.toUpperCase() === "PENDING").length;
  }, [signUpRequestsData]);

  return (
    <Container>
      <DocsHeader title="사용자 정보" breadcrumb={["마이페이지"]} />

      <ContentWrapper>
        <Title>사용자 정보</Title>
        <Subtitle>나의 정보를 확인하거나 수정할 수 있어요</Subtitle>

        {isLoading ? (
          <LoadingText>불러오는 중...</LoadingText>
        ) : user ? (
          <ProfileForm>
            <FloatingInput
              label="이름"
              value={user.name}
              readOnly
            />
            <FloatingInput
              label="이메일"
              value={user.email}
              readOnly
            />
            <FloatingInput
              label="역할"
              value={user.role}
              readOnly
            />

            {isAdmin ? (
              <AdminSection>
                <AdminSectionTitle>회원가입 신청</AdminSectionTitle>
                <AdminSectionDescription>
                  대기 중인 회원가입 신청 {pendingCount}건
                </AdminSectionDescription>
                {isSignUpRequestsLoading ? (
                  <AdminStatusText>신청 내역을 확인하는 중입니다.</AdminStatusText>
                ) : null}
                {signUpRequestsError ? (
                  <AdminStatusText error>신청 내역을 불러오지 못했습니다.</AdminStatusText>
                ) : null}
                <AdminManageLink href="/user/sign-up-requests">
                  회원가입 신청 관리로 이동
                </AdminManageLink>
                <AdminManageLink href="/user/api-use-reasons">
                  전체 사용 신청 관리로 이동
                </AdminManageLink>
              </AdminSection>
            ) : null}
          </ProfileForm>
        ) : (
          <ErrorText>사용자 정보를 불러올 수 없습니다.</ErrorText>
        )}
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

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
  margin-bottom: 40px;
`;

const Title = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 12px;
`;

const LoadingText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
`;

const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.bssmRed};
`;

const ProfileForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 400px;
`;

const AdminSection = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 12px;
  padding: 16px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AdminSectionTitle = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0;
`;

const AdminSectionDescription = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[600]};
  margin: 0;
`;

const AdminStatusText = styled.p<{ error?: boolean }>`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ error, theme }) => (error ? theme.colors.bssmRed : theme.colors.grey[500])};
  margin: 0;
`;

const AdminManageLink = styled(Link)`
  width: fit-content;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.bssmDarkBlue};
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
`;
