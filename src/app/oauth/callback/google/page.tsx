/* eslint-disable */
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenManager } from "@/utils/fetcher";
import { signUpApi } from "@/app/sign-up/api";
import { userApi } from "@/app/user/api";
import { docsApi } from "@/app/docs/api";
import styled from "@emotion/styled";

import { useLoginMutation } from "@/app/login/queries";
import { useUserStore } from "@/store/userStore";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("로그인 중입니다");

  const loginMutation = useLoginMutation();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

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
          setStatus("인증 오류: Code verifier가 없습니다.");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        let response;
        try {
          response = await loginMutation.mutateAsync({ code, codeVerifier });
        } catch (error) {
          console.error("Login failed:", error);
          router.push("/sign-up");
          return;
        }

        const accessToken = response?.accessToken;
        sessionStorage.removeItem('codeVerifier');

        if (accessToken) {
          tokenManager.setTokens(accessToken, response.refreshToken);
          setStatus("로그인 성공! 회원 정보 확인 중...");

          await new Promise(resolve => setTimeout(resolve, 500));

          try {
            const user = await userApi.getUser();

            if (user) {
              useUserStore.getState().setUser(user);
              tokenManager.setUserName(user.name);
            }

            router.push("/");
          } catch (e) {
            console.log("User not found, redirecting to sign-up");
            setStatus("회원가입이 필요합니다. 이동 중...");
            router.push("/sign-up");
          }
        } else {
          setStatus("회원가입이 필요합니다. 이동 중...");
          router.push("/sign-up");
        }

      } catch (error: any) {
        console.error("Callback processing failed:", error);
        setStatus(`처리 중 오류가 발생했습니다: ${error.message}`);
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

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<Container><Message>로딩 중...</Message></Container>}>
      <GoogleCallbackContent />
    </Suspense>
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
