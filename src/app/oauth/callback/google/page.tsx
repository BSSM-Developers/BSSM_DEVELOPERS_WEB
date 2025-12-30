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
        const codeVerifier = sessionStorage.getItem('codeVerifier');
        if (!codeVerifier) {
          console.error("Code verifier not found");
          setStatus("인증 오류: Code verifier가 없습니다.");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        let response;
        try {
          response = await api.auth.loginWithGoogle(code, codeVerifier);
        } catch (error) {
          console.log("Login failed (likely new user), redirecting to sign-up:", error);
          // If login fails (e.g. 401), it implies we need to sign up.
          // The backend should have set the signup-token cookie.
          router.push("/sign-up");
          return;
        }

        const { accessToken } = response;

        // Clear verifier
        sessionStorage.removeItem('codeVerifier');

        if (accessToken) {
          // Existing user
          tokenManager.setTokens(accessToken);
          setStatus("로그인 성공! 이동 중...");

          // Check status just in case, or go straight to home
          try {
            const mySignUp = await api.signUp.getMy();
            if (mySignUp.state === 'APPROVED') {
              router.push("/");
            } else {
              router.push("/sign-up");
            }
          } catch (e) {
            router.push("/");
          }
        } else {
          // New user (accessToken missing, signup-token cookie should be present)
          setStatus("회원가입이 필요합니다. 이동 중...");
          router.push("/sign-up");
        }

      } catch (error) {
        console.error("Callback processing failed:", error);
        setStatus("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
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
