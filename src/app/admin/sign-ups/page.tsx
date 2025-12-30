"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokenManager } from "@/lib/api";
import styled from "@emotion/styled";

type SignUpRequest = {
  signupFormId: number;
  signupRequestId: number;
  name: string;
  email: string;
  profile: string;
  purpose: string;
  state: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export default function AdminSignUpsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SignUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const checkAdmin = () => {
      const role = tokenManager.getUserRole();
      if (role !== 'ROLE_ADMIN') {
        alert("관리자 권한이 필요합니다.");
        router.push("/");
        return false;
      }
      return true;
    };

    if (checkAdmin()) {
      fetchRequests();
    }
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Fetch list (cursorId undefined for first page, size 50 for now)
      const response = await api.signUp.getRequests(undefined, 50);
      console.log("Admin Requests Response:", response); // Debug log
      setRequests(response.data?.values || []);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      alert("신청 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("승인하시겠습니까?")) return;
    try {
      setProcessingId(id);
      await api.signUp.approve(id);
      alert("승인되었습니다.");
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Approve failed:", error);
      alert("승인 처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("거절하시겠습니까?")) return;
    try {
      setProcessingId(id);
      await api.signUp.reject(id);
      alert("거절되었습니다.");
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Reject failed:", error);
      alert("거절 처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <Container>로딩 중...</Container>;
  }

  return (
    <Container>
      <Header>
        <Title>회원가입 신청 관리</Title>
        <RefreshButton onClick={fetchRequests}>새로고침</RefreshButton>
      </Header>

      <List>
        {requests.length === 0 ? (
          <EmptyState>신청 내역이 없습니다.</EmptyState>
        ) : (
          requests.map((req) => (
            <RequestCard key={req.signupFormId}>
              <UserInfo>
                <Name>{req.name}</Name>
                <Email>{req.email}</Email>
                <Status badge={req.state}>{req.state}</Status>
              </UserInfo>

              <PurposeBox>
                <Label>신청 목적:</Label>
                <Purpose>{req.purpose}</Purpose>
              </PurposeBox>

              {req.state === 'PENDING' && (
                <ActionButtons>
                  <ApproveButton
                    onClick={() => handleApprove(req.signupFormId)}
                    disabled={processingId === req.signupFormId}
                  >
                    승인
                  </ApproveButton>
                  <RejectButton
                    onClick={() => handleReject(req.signupFormId)}
                    disabled={processingId === req.signupFormId}
                  >
                    거절
                  </RejectButton>
                </ActionButtons>
              )}
            </RequestCard>
          ))
        )}
      </List>
    </Container>
  );
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background-color: #e5e7eb; }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #6b7280;
  padding: 40px;
`;

const RequestCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const Name = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

const Email = styled.span`
  color: #6b7280;
  font-size: 14px;
`;

const Status = styled.span<{ badge: string }>`
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ badge }) =>
    badge === 'APPROVED' ? '#dcfce7' :
      badge === 'REJECTED' ? '#fee2e2' : '#fef3c7'};
  color: ${({ badge }) =>
    badge === 'APPROVED' ? '#166534' :
      badge === 'REJECTED' ? '#991b1b' : '#92400e'};
`;

const PurposeBox = styled.div`
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
`;

const Purpose = styled.p`
  color: #374151;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ApproveButton = styled(Button)`
  background-color: #2563eb;
  color: white;
  &:hover:not(:disabled) { background-color: #1d4ed8; }
`;

const RejectButton = styled(Button)`
  background-color: #ef4444;
  color: white;
  &:hover:not(:disabled) { background-color: #dc2626; }
`;
