"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import styled from "@emotion/styled";

type SignUpStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';

export default function SignUpPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SignUpStatus>('NONE');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', purpose: '' });
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | undefined>(undefined);
  const [formId, setFormId] = useState<number | null>(null);

  useEffect(() => {
    console.log("SignUpPage mounted");
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await api.signUp.getMy();
      setStatus(response.state);
      setFormId(response.signupFormId);
      setFormData({ name: response.name || '', purpose: response.purpose || '' });

      // Assuming REJECTED doesn't come with a separate reason field in the response shown in screenshot, 
      // but maybe it's in the 'message' or handled differently. 
      // For now, not setting rejectReason unless I find where it is.

      if (response.state === 'APPROVED') {
        setTimeout(() => router.push("/"), 2000);
      }
    } catch (error) {
      // If 404, maybe it means no form exists yet? 
      // But Apidog suggests /signup/me returns a structure.
      // If error, we might assume NONE or handle error.
      console.error("Failed to get sign up status:", error);
      setStatus('NONE');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purpose) {
      alert("신청 목적을 입력해주세요.");
      return;
    }

    if (formId === null) {
      alert("신청 폼 ID를 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await api.signUp.updatePurpose(formId, formData.purpose);
      await checkStatus();
      alert("신청이 제출되었습니다.");
    } catch (error) {
      console.error("Sign up failed:", error);
      alert("신청 제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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

  if (status === 'PENDING') {
    return (
      <Container>
        <Card>
          <Title>승인 대기 중</Title>
          <Description>관리자의 승인을 기다리고 있습니다.</Description>
          <InfoText>신청 내용 검토 후 승인 처리가 진행됩니다.</InfoText>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <Title>{status === 'REJECTED' ? '가입 신청 수정' : '회원가입 신청'}</Title>
        <Description>
          {status === 'REJECTED'
            ? `거절 사유: ${rejectReason || '사유 없음'}`
            : 'BSSM Developers 서비스 이용을 위해 가입 신청이 필요합니다.'}
        </Description>

        <Form onSubmit={handleSubmit}>
          {status !== 'REJECTED' && (
            <InputGroup>
              <Label>이름</Label>
              <Input
                type="text"
                placeholder="실명을 입력해주세요"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label>신청 목적</Label>
            <TextArea
              placeholder="서비스 이용 목적을 구체적으로 적어주세요"
              value={formData.purpose}
              onChange={e => setFormData({ ...formData, purpose: e.target.value })}
              disabled={submitting}
              rows={4}
            />
          </InputGroup>

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? "제출 중..." : (status === 'REJECTED' ? "수정하여 다시 제출" : "신청하기")}
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
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
`;

const Description = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  line-height: 1.5;
`;

const InfoText = styled.p`
  color: #3b82f6;
  background: #eff6ff;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px solid #3b82f6;
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px solid #3b82f6;
  }
`;

const SubmitButton = styled.button`
  padding: 14px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;
