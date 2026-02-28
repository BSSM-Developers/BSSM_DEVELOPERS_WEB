/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMyProfileQuery, useUpdatePurposeMutation } from "@/app/sign-up/queries";
import styled from "@emotion/styled";
import { FloatingInput } from "@/components/ui/FloatingInput";

export default function SignUpPage() {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const { data: profileData, isLoading } = useMyProfileQuery();
  const updatePurposeMutation = useUpdatePurposeMutation();

  const status = profileData?.state || 'NONE';

  useEffect(() => {
    if (profileData?.purpose) {
      setPurpose(profileData.purpose);
    }
    if (profileData?.state === 'APPROVED') {
      setTimeout(() => router.push("/"), 2000);
    }
  }, [profileData, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) {
      alert("신청 목적을 입력해주세요.");
      return;
    }

    const id = profileData?.signupRequestId || profileData?.signupFormId;

    if (!id) {
      alert("신청서 ID를 찾을 수 없습니다.");
      return;
    }

    try {
      await updatePurposeMutation.mutateAsync({ id, purpose });
      alert("신청이 제출되었습니다.");
    } catch (error) {
      console.error("Sign up failed:", error);
      alert("신청 제출에 실패했습니다.");
    }
  };

  if (isLoading) {
    return <Container>로딩 중...</Container>;
  }

  if (status === 'APPROVED') {
    return (
      <Container>
        <Title>가입 승인됨</Title>
        <Description>회원가입이 승인되었습니다. 메인 페이지로 이동합니다.</Description>
      </Container>
    );
  }

  return (
    <Container>
      <Title>회원가입 신청</Title>

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
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  background-color: white;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #000;
  margin-bottom: 60px;
  text-align: center;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Description = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 60px;
  align-items: center;
`;

const SubmitButton = styled.button`
  padding: 16px 60px;
  background-color: #16335C;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  min-width: 200px;

  &:hover:not(:disabled) {
    background-color: #0e2241;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
