"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { githubApi } from "./api";
import { useGitHubConnectionQuery } from "./queries";
import { track } from "@/lib/analytics";
import { useVariantValue } from "@mab-kit/react";

// MAB A/B 테스트: GitHub 연동 버튼 문구 (control vs test)
// flagKey "github-connect-cta", 전환 이벤트 "github_connect_clicked"(handleConnect에서 track)
const GITHUB_CTA_FLAG = "github-connect-cta";
// GitHub App 설치 페이지(정적). 환경별로 앱이 다르므로 env로 주입.
//   prod: bssm-developers-api-maker / dev·local: bssm-developers-api-maker-dev (미설정 시 폴백)
// 백엔드가 주는 installUrl은 환경에 따라 localhost로 튕기는 등 신뢰할 수 없어 사용하지 않는다.
const GITHUB_APP_INSTALL_URL =
  process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL ??
  "https://github.com/apps/bssm-developers-api-maker-dev/installations/select_target";

export default function GitHubPage() {
  const { data: connection, isLoading } = useGitHubConnectionQuery();

  const [isConnecting, setIsConnecting] = useState(false);

  // MAB 변형: 연동 버튼 문구 (control = 기존, test = 가치 강조). stickyLock으로 경계 이동 완화.
  const ctaLabel = useVariantValue(
    GITHUB_CTA_FLAG,
    {
      control: "GitHub 연동하기",
      test: "1분 만에 내 API 문서 만들기",
    },
    { defaultVariant: "control", stickyLock: true }
  );

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      track("github_connect_clicked");
      const url = await githubApi.getAuthorizeUrl();
      window.location.href = url;
    } catch (error) {
      console.error("GitHub 인증 URL 조회 실패:", error);
      track("github_connect_failed", { stage: "authorize_url" });
      setIsConnecting(false);
    }
  };

  const handleInstallApp = () => {
    // 항상 정적 env 설치 링크를 사용 (백엔드 installUrl 미사용)
    const target = GITHUB_APP_INSTALL_URL;
    track("github_app_install_clicked");
    window.open(target, "_blank", "noopener,noreferrer");
  };


  if (isLoading) {
    return (
      <Container>
        <DocsHeader title="GitHub 연동" breadcrumb={["마이페이지"]} />
        <ContentWrapper>
          <BsdevLoader label="GitHub 연동 정보를 불러오는 중..." size={56} minHeight="160px" />
        </ContentWrapper>
      </Container>
    );
  }

  // ── 미연동 상태 ──────────────────────────────────────────────
  if (!connection) {
    return (
      <Container>
        <DocsHeader title="GitHub 연동" breadcrumb={["마이페이지"]} />
        <ContentWrapper>
          <Title>GitHub 연동</Title>
          <Subtitle>GitHub 계정을 연동하면 레포지토리를 등록하고 API 문서를 자동 관리할 수 있어요</Subtitle>

          <StatusCard>
            <GitHubIcon>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </GitHubIcon>
            <StatusTitle>GitHub 미연동</StatusTitle>
            <StatusDesc>
              GitHub OAuth를 통해 계정을 연동하면<br />
              레포지토리 기반 API 문서 자동 관리가 가능해요
            </StatusDesc>
            <ConnectButton onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? "이동 중..." : ctaLabel}
            </ConnectButton>
          </StatusCard>
        </ContentWrapper>
      </Container>
    );
  }

  // ── 연동됨 + App 미설치 상태 ──────────────────────────────
  if (!connection.appInstalled) {
    return (
      <Container>
        <DocsHeader title="GitHub 연동" breadcrumb={["마이페이지"]} />
        <ContentWrapper>
          <Title>GitHub 연동</Title>
          <Subtitle>GitHub App을 설치하면 레포지토리 등록이 가능해요</Subtitle>

          <StatusCard>
            <BadgeRow>
              <Badge variant="success">✓ GitHub 계정 연동됨</Badge>
              <Badge variant="warning">⚠ App 미설치</Badge>
            </BadgeRow>
            <LoginText>@{connection.githubLogin}</LoginText>
            <StatusDesc>
              레포지토리를 등록하려면 GitHub App을 설치해야 해요.<br />
              설치 화면에서 레포지토리를 추가하면 자동으로 반영됩니다.
            </StatusDesc>
            <ButtonRow>
              <ConnectButton onClick={handleInstallApp}>
                GitHub App 설치하기
              </ConnectButton>
            </ButtonRow>
          </StatusCard>
        </ContentWrapper>
      </Container>
    );
  }

  // ── 완전 연동 상태 ────────────────────────────────────────
  return (
    <Container>
      <DocsHeader title="GitHub 연동" breadcrumb={["마이페이지"]} />
      <ContentWrapper>
        <Title>GitHub 연동</Title>
        <Subtitle>GitHub 계정이 연동되어 있어요</Subtitle>

        <StatusCard>
          <BadgeRow>
            <Badge variant="success">✓ GitHub 계정 연동됨</Badge>
            <Badge variant="success">✓ App 설치됨</Badge>
          </BadgeRow>
          <LoginText>@{connection.githubLogin}</LoginText>
          <StatusDesc>
            API 문서를 등록할 때 레포지토리와 브랜치를 선택할 수 있어요.<br />
            새 레포지토리를 추가하려면 아래에서 App 설정을 열어 권한을 추가하세요.
          </StatusDesc>
          <ButtonRow>
            <OutlineButton onClick={handleInstallApp}>
              레포지토리 추가 / 관리
            </OutlineButton>
          </ButtonRow>
        </StatusCard>
      </ContentWrapper>
    </Container>
  );
}

// ── Styles ────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ContentWrapper = styled.div`
  padding: 0 24px 24px 24px;
`;

const Title = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
  margin-bottom: 32px;
`;

const StatusCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 32px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200] ?? "#E5E7EB"};
  border-radius: 16px;
  background: #ffffff;
  max-width: 480px;
`;

const GitHubIcon = styled.div`
  color: #1F2937;
`;

const StatusTitle = styled.p`
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const StatusDesc = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: #6B7280;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const LoginText = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ variant: "success" | "warning" }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  background: ${({ variant }) =>
    variant === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)"};
  color: ${({ variant }) =>
    variant === "success" ? "#059669" : "#D97706"};
`;

const ConnectButton = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  background: #16335C;
  color: white;
  font-size: 15px;
  font-weight: 700;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  border: none;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1a3a68;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const OutlineButton = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  background: white;
  color: #16335C;
  font-size: 15px;
  font-weight: 700;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  border: 1.5px solid #16335C;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(22, 51, 92, 0.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;
