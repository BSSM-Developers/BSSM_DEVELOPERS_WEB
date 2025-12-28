"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, tokenManager } from "@/lib/api";
import styled from "@emotion/styled";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("인증 처리 중...");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("인증 코드가 없습니다. 다시 시도해주세요.");
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    const login = async () => {
      try {
        const { accessToken } = await api.auth.loginWithGoogle(code);
        // Refresh token might be handled via cookie or not provided. Passing empty string for now.
        tokenManager.setTokens(accessToken, '');
        setStatus("로그인 성공! 이동 중...");

        // Check sign up status or redirect to home
        try {
          const mySignUp = await api.signUp.getMy();
          if (mySignUp.state === 'APPROVED') {
            router.push("/");
          } else {
            router.push("/sign-up");
          }
        } catch (e) {
          // If 404 or other error, likely need to sign up (or create initial record via update)
          router.push("/sign-up");
        }

      } catch (error) {
        console.error("Login failed:", error);
        setStatus("로그인 처리에 실패했습니다. 다시 시도해주세요.");
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    login();
  }, [searchParams, router]);

  return (
    <Container>
      <Message>{status}</Message>
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

const Message = styled.h2`
  font-size: 20px;
  color: #374151;
`;
