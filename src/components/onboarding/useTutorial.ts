"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { isTutorialSeen, markTutorialSeen, getCurrentUserId } from "@/lib/onboarding";
import { getStepsForPath, normalizePath } from "@/lib/tutorialStore";
import type { TutorialStep } from "./Spotlight";

interface UseTutorialOptions {
  /** 시작 조건이 충족됐는지 (예: 데이터 로딩 완료). 기본 true */
  ready?: boolean;
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * 사용자당 1회 스포트라이트 튜토리얼.
 * - 스텝은 localStorage 오버라이드(dev 편집) ?? 코드 기본값(fallbackSteps)
 * - 미열람 + 로그인 + ready 일 때 자동 시작
 * - dev + ?edit=1 (편집 모드)에서는 자동 재생하지 않음
 */
export function useTutorial(
  tutorialId: string,
  fallbackSteps: TutorialStep[],
  options: UseTutorialOptions = {}
) {
  const ready = options.ready ?? true;
  const storeUserId = useUserStore((s) => s.user?.id ?? null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editMode = isDev && searchParams?.get("edit") === "1";

  const pathKey = useMemo(() => normalizePath(pathname || "/"), [pathname]);

  // 오버라이드 ?? 코드 기본값
  const [steps, setSteps] = useState<TutorialStep[]>(fallbackSteps);
  useEffect(() => {
    setSteps(getStepsForPath(pathKey, fallbackSteps));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathKey]);

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // store user.id 우선, 없으면 JWT sub 폴백 (로그인됐는데 store 비어있는 경우 대응)
  const [userId, setUserId] = useState<string | number | null>(null);
  useEffect(() => {
    setUserId(storeUserId ?? getCurrentUserId());
  }, [storeUserId]);

  // 자동 시작 (편집 모드에서는 비활성)
  useEffect(() => {
    if (editMode) return;
    if (!ready || open) return;
    if (userId == null) return;
    if (isTutorialSeen(userId, tutorialId)) return;
    if (steps.length === 0) return;
    // 대상이 그려질 시간을 약간 준다
    const t = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, tutorialId, steps.length, editMode]);

  const finish = useCallback(() => {
    setOpen(false);
    markTutorialSeen(userId, tutorialId);
  }, [userId, tutorialId]);

  const onNext = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, finish]);

  const onPrev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const onSkip = useCallback(() => {
    finish();
  }, [finish]);

  return {
    spotlightProps: { steps, stepIndex, open, onNext, onPrev, onSkip },
  };
}
