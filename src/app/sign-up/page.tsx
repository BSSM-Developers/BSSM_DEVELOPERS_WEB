/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMyProfileQuery, useUpdatePurposeMutation } from "@/app/sign-up/queries";
import styled from "@emotion/styled";

type SignUpStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';

export default function SignUpPage() {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const { data: profileData, isLoading } = useMyProfileQuery();
  const updatePurposeMutation = useUpdatePurposeMutation();

  const status = profileData?.state || 'NONE';
  const name = profileData?.name || '';

  // Initialize purpose when data is loaded
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

    // We need formId or requestId. The API probably needs id.
    // getMy returns signupFormId or signupRequestId.
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
        <Card>
          <Title>가입 승인됨</Title>
          <Description>회원가입이 승인되었습니다. 메인 페이지로 이동합니다.</Description>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <Title>
          {status === 'REJECTED' ? '가입 신청 수정' :
            status === 'PENDING' ? '신청 내역 수정' : '회원가입 신청'}
        </Title>
        <Description>
          {status === 'REJECTED'
            ? `거절 사유: 사유 없음` // API does not seem to return reject reason in simple getMy
            : status === 'PENDING'
              ? '승인 대기 중입니다. 신청 사유를 수정할 수 있습니다.'
              : 'BSSM Developers 서비스 이용을 위해 가입 신청이 필요합니다.'}
        </Description>

        <Form onSubmit={handleSubmit}>
          {status !== 'REJECTED' && (
            <InputGroup>
              <Label>이름</Label>
              <Input
                type="text"
                value={name}
                disabled={true}
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label>신청 목적</Label>
            <TextArea
              placeholder="서비스 이용 목적을 구체적으로 적어주세요"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              disabled={updatePurposeMutation.isPending}
              rows={4}
            />
          </InputGroup>

          <SubmitButton type="submit" disabled={updatePurposeMutation.isPending}>
            {updatePurposeMutation.isPending ? "제출 중..." :
              (status === 'REJECTED' || status === 'PENDING' ? "수정하여 다시 제출" : "신청하기")}
          </SubmitButton>
        </Form>
      </Card>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 480px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 40px;
  text-align: center;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Description = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: ${({ theme }) => theme.colors.background};
  padding: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.grey[700]};
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 16px;
  transition: all 0.2s;
  font-family: "Spoqa Han Sans Neo", sans-serif;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.bssmBlue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.bssmBlue}20;
  }

  &:read-only {
    background-color: ${({ theme }) => theme.colors.grey[100]};
    color: ${({ theme }) => theme.colors.grey[500]};
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 16px;
  min-height: 150px;
  resize: vertical;
  transition: all 0.2s;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  line-height: 1.6;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.bssmBlue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.bssmBlue}20;
  }
`;

const SubmitButton = styled.button`
  margin-top: 16px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.bssmBlue};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Spoqa Han Sans Neo", sans-serif;

  &:hover:not(:disabled) {
    background-color: #005694;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.grey[400]};
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const StatusTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 16px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const StatusDescription = styled.p`
  color: ${({ theme }) => theme.colors.grey[600]};
  font-size: 16px;
  line-height: 1.6;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const EditButton = styled.button`
  margin-top: 24px;
  padding: 12px 24px;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  color: ${({ theme }) => theme.colors.grey[700]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Spoqa Han Sans Neo", sans-serif;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[50]};
    border-color: ${({ theme }) => theme.colors.grey[400]};
  }
`;
