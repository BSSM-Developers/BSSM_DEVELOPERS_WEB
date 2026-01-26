/* eslint-disable */
"use client";

import { useState } from "react";
import styled from "@emotion/styled";

import { generateCodeVerifier, generateCodeChallenge } from "@/utils/pkce";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

    if (!clientId) {
      alert("Google Client ID가 설정되지 않았습니다.");
      return;
    }

    try {
      setIsLoading(true);

      if (typeof window === 'undefined' || !window.crypto) {
        throw new Error("보안 컨텍스트(HTTPS)가 필요하거나 window.crypto를 지원하지 않는 브라우저입니다.");
      }

      // PKCE 값 생성
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // 콜백을 위한 검증자 저장
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('codeVerifier', codeVerifier);
      }

      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&code_challenge=${codeChallenge}&code_challenge_method=S256`;

      console.log("Redirecting to Google Auth:", url);
      window.location.href = url;
    } catch (error: any) {
      console.error("Login failed", error);
      alert(`로그인 처리 중 오류가 발생했습니다: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <ContentWrapper>
        <LogoWrapper>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        </LogoWrapper>
        <Title>Google 로그인이 필요합니다</Title>
        <LoginButton onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? "이동 중..." : "로그인"}
        </LoginButton>
      </ContentWrapper>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #ffffff;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const LogoWrapper = styled.div`
  margin-bottom: 8px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  margin-bottom: 16px;
`;

const LoginButton = styled.button`
  padding: 12px 48px;
  background-color: #1f2937;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: "Spoqa Han Sans Neo", sans-serif;

  &:hover {
    background-color: #111827;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
