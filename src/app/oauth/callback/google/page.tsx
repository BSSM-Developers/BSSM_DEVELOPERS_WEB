/* eslint-disable */
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenManager } from "@/utils/fetcher";
import { signUpApi } from "@/app/sign-up/api";
import { docsApi } from "@/app/docs/api";
import styled from "@emotion/styled";

import { useLoginMutation } from "@/app/login/queries";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("인증 처리 중...");

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
            const mySignUp = await signUpApi.getMy({ suppressLogout: true });

            if (mySignUp.name) {
              tokenManager.setUserName(mySignUp.name);
            }

            if (mySignUp.state === 'APPROVED') {
              router.push("/");
            } else {
              router.push("/sign-up");
            }
          } catch (e: any) {
            console.error("getMy failed:", e);

            try {
              await docsApi.getList();

              try {
                const base64Url = accessToken.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                if (payload.email) {
                  tokenManager.setUserName(payload.email.split('@')[0]);
                } else {
                  tokenManager.setUserName("User");
                }
              } catch (parseError) {
                tokenManager.setUserName("User");
              }

              router.push("/");
            } catch (listError: any) {
              console.error("Token validation failed:", listError);
              // 토큰이 유효하지 않은 경우 명시적으로 알림
              if (listError.message?.includes('Unauthorized')) {
                setStatus("인증 토큰이 유효하지 않거나 만료되었습니다. 다시 로그인해주세요.");
                setTimeout(() => router.push("/login"), 2000);
              } else {
                setStatus(`로그인 검증 중 오류가 발생했습니다: ${listError.message}`);
              }
            }
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
