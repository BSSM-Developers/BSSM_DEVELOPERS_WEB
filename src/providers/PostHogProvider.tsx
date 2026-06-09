"use client";

import { ReactNode, Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { tokenManager } from "@/utils/fetcher";
import { identifyFromToken, resetAnalytics } from "@/lib/analytics";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// 리버스 프록시(/ingest) 경유 → 광고차단기 우회. next.config.ts 의 rewrites 와 짝.
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest";
const POSTHOG_UI_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com";

let initialized = false;

function initPostHog() {
  if (initialized || typeof window === "undefined" || !POSTHOG_KEY) return;
  initialized = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_UI_HOST,

    // ── 페이지뷰는 App Router 라우팅에 맞춰 수동 처리 ──
    capture_pageview: false,
    capture_pageleave: true,

    // ── "전부 수집" ──
    autocapture: true, // 클릭/입력/폼 제출 자동 캡처
    capture_dead_clicks: true, // 반응 없는 클릭(UX 문제) 캡처
    rageclick: true, // 분노 클릭 캡처

    // ── 세션 리플레이(화면 녹화). 프로젝트 설정에서 Recording 활성화 필요 ──
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: false, // 입력값까지 녹화 (민감정보 마스킹은 아래 메모 참고)
      maskInputOptions: {
        // 비밀번호는 항상 마스킹 (보안). 나머지는 그대로 수집.
        password: true,
      },
    },

    persistence: "localStorage+cookie",

    loaded: (ph) => {
      // 새로고침/첫 진입 시 기존 로그인 상태 식별
      identifyFromToken(tokenManager.getAccessToken());
      if (process.env.NODE_ENV === "development") {
        ph.debug(false);
      }
    },
  });
}

/** 라우트 변경마다 $pageview 전송 (App Router 는 자동 X) */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

/** 로그인/로그아웃(auth-token-changed) 시 자동 identify / reset */
function AuthSync() {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    const sync = () => {
      const token = tokenManager.getAccessToken();
      if (token) {
        identifyFromToken(token);
      } else {
        resetAnalytics();
      }
    };

    window.addEventListener("auth-token-changed", sync);
    return () => window.removeEventListener("auth-token-changed", sync);
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  // 키가 없으면(로컬 미설정 등) 그냥 패스스루 → 빌드/렌더 안전
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <AuthSync />
      {children}
    </PHProvider>
  );
}
