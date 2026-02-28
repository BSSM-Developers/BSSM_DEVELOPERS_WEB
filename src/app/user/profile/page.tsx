"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useUserQuery } from "../queries";
import { FloatingInput } from "@/components/ui/FloatingInput";

export default function ProfilePage() {
  const { data: user, isLoading } = useUserQuery();

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
