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
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const RefreshButton = styled.button`
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.grey[100]};
  color: ${({ theme }) => theme.colors.grey[700]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Spoqa Han Sans Neo", sans-serif;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey[200]};
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.grey[500]};
  padding: 80px;
  background: ${({ theme }) => theme.colors.grey[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: 18px;
`;

const RequestCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[100]};
`;

const Name = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Email = styled.span`
  color: ${({ theme }) => theme.colors.grey[500]};
  font-size: 15px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Status = styled.span<{ badge: string }>`
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  
  background-color: ${({ badge, theme }) =>
    badge === 'APPROVED' ? `${theme.colors.bssmGreen}15` :
      badge === 'REJECTED' ? `${theme.colors.bssmRed}15` : `${theme.colors.bssmYellow}15`};
  
  color: ${({ badge, theme }) =>
    badge === 'APPROVED' ? theme.colors.bssmGreen :
      badge === 'REJECTED' ? theme.colors.bssmRed : theme.colors.bssmYellow};
`;

const PurposeBox = styled.div`
  background-color: ${({ theme }) => theme.colors.grey[50]};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: 24px;
`;

const Label = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.grey[500]};
  margin-bottom: 8px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Purpose = styled.p`
  color: ${({ theme }) => theme.colors.grey[800]};
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 16px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-size: 15px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  
  &:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
  }
`;

const ApproveButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.bssmBlue};
  color: white;
  &:hover:not(:disabled) { 
    background-color: #005694; 
    transform: translateY(-1px);
  }
`;

const RejectButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.grey[200]};
  color: ${({ theme }) => theme.colors.grey[700]};
  &:hover:not(:disabled) { 
    background-color: ${({ theme }) => theme.colors.grey[300]}; 
  }
`;
