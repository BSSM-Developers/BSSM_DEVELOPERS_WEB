"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { api } from "@/lib/api";

import { generateCodeVerifier, generateCodeChallenge } from "@/utils/pkce";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '586164535148-28sggvc0esanl1k84r93pbk87oui3ucg.apps.googleusercontent.com';
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3001/oauth/callback/google';

    if (!clientId) {
      alert("Google Client ID가 설정되지 않았습니다.");
      return;
    }

    try {
      setIsLoading(true);
      // Generate PKCE values
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store verifier for callback
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('codeVerifier', codeVerifier);
      }

      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      window.location.href = url;
    } catch (error) {
      console.error("PKCE generation failed", error);
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Title>BSSM Developers 로그인</Title>
        <Description>서비스 이용을 위해 로그인이 필요합니다.</Description>
        <GoogleButton onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? "이동 중..." : "Google 계정으로 로그인"}
        </GoogleButton>
      </LoginCard>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f9fafb;
`;

const LoginCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  text-align: center;
  width: 100%;
  max-width: 400px;
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
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #f3f4f6;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
