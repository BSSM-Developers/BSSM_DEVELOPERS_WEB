"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenManager } from "@/utils/fetcher";
import { githubApi } from "@/app/user/github/api";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { track } from "@/lib/analytics";

const GITHUB_INSTALL_URL_KEY = "github_install_url";

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("GitHub 계정을 연동하는 중입니다...");
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const code = searchParams.get("code");

    if (!code) {
      setStatus("인증 코드가 없습니다. 다시 시도해주세요.");
      setTimeout(() => router.push("/user/github"), 2000);
      return;
    }

    const connect = async () => {
      try {
        const result = await githubApi.connect(code);

        // Role이 API_MAKER로 승격된 새 JWT 저장
        tokenManager.setTokens(result.accessToken);

        // GitHub App 설치 URL을 세션에 임시 보관 (연동 페이지에서 사용)
        if (result.installUrl) {
          sessionStorage.setItem(GITHUB_INSTALL_URL_KEY, result.installUrl);
        }

        track("github_connect_succeeded", {
          appInstalled: !result.installUrl,
        });

        setStatus("GitHub 연동 완료! 이동 중...");
        router.replace("/user/github");
      } catch (error) {
        track("github_connect_failed", { stage: "connect" });
        console.error("GitHub 연동 실패:", error);
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        setStatus(`연동 실패: ${message}`);
        setTimeout(() => router.push("/user/github"), 3000);
      }
    };

    connect();
  }, [searchParams, router]);

  return <BsdevLoader fullScreen label={status} size={92} />;
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <BsdevLoader
          fullScreen
          label="GitHub 인증 정보를 확인하는 중입니다..."
          size={92}
        />
      }
    >
      <GitHubCallbackContent />
    </Suspense>
  );
}
