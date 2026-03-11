"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenManager } from "@/utils/fetcher";
import { signUpApi } from "@/app/sign-up/api";
import { userApi } from "@/app/user/api";
import { BsdevLoader } from "@/components/common/BsdevLoader";

import { useLoginMutation } from "@/app/login/queries";
import { authApi } from "@/app/login/api";
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
          try {
            const signUpProfile = await signUpApi.getMy();
            if (signUpProfile.state === "APPROVED") {
              const refreshed = await authApi.refreshAccessToken();
              if (refreshed.accessToken) {
                tokenManager.setTokens(refreshed.accessToken, refreshed.refreshToken);
                const user = await userApi.getUser();
                useUserStore.getState().setUser(user);
                tokenManager.setUserName(user.name);
                router.replace("/");
                return;
              }
            }
          } catch (innerError) {
            console.error("Fallback login path failed:", innerError);
          }
          router.replace("/sign-up");
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
          } catch (error) {
            console.error(error);
            console.log("User not found, redirecting to sign-up");
            setStatus("회원가입이 필요합니다. 이동 중...");
            router.push("/sign-up");
          }
        } else {
          setStatus("회원가입이 필요합니다. 이동 중...");
          router.push("/sign-up");
        }

      } catch (error: unknown) {
        console.error("Callback processing failed:", error);
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
        setStatus(`처리 중 오류가 발생했습니다: ${errorMessage}`);
      }
    };

    login();
  }, [searchParams, router, loginMutation]);

  return (
    <BsdevLoader fullScreen label={status} size={92} />
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<BsdevLoader fullScreen label="로그인 정보를 확인하는 중입니다..." size={92} />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
