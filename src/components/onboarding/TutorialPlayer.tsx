"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Spotlight } from "./Spotlight";
import { isTutorialSeen, markTutorialSeen, getCurrentUserId } from "@/lib/onboarding";
import { getStepsForPath, normalizePath } from "@/lib/tutorialStore";
import { getRegistrySteps } from "@/lib/tutorialRegistry";
import type { TutorialStep } from "./Spotlight";

const isDev = process.env.NODE_ENV !== "production";

/**
 * 전역 튜토리얼 플레이어.
 * 어느 페이지든 현재 경로(pathKey)에 정의된 튜토리얼(오버라이드 ?? 레지스트리 기본값)을
 * 사용자당 1회 자동 재생한다. dev + ?edit=1 (편집 모드)에서는 재생하지 않는다.
 */
function PlayerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editMode = isDev && searchParams?.get("edit") === "1";

  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [pathKey, setPathKey] = useState("");
  const [userId, setUserId] = useState<string | number | null>(null);

  useEffect(() => {
    setUserId(getCurrentUserId());
  }, [pathname]);

  // 경로 변경 시: 닫고, 해당 경로 steps 로드 후 자동 시작 판단
  useEffect(() => {
    setOpen(false);
    setStepIndex(0);

    const key = normalizePath(pathname || "/");
    setPathKey(key);

    if (editMode) return; // 편집 모드에선 재생 안 함

    const resolved = getStepsForPath(key, getRegistrySteps(key));
    setSteps(resolved);

    if (resolved.length === 0) return;
    const uid = getCurrentUserId();
    if (uid == null) return;
    // pathKey 단위로 1회성 (tutorialId = "path:<pathKey>")
    if (isTutorialSeen(uid, `path:${key}`)) return;

    const t = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 500);
    return () => window.clearTimeout(t);
  }, [pathname, editMode]);

  const finish = useCallback(() => {
    setOpen(false);
    markTutorialSeen(userId ?? getCurrentUserId(), `path:${pathKey}`);
  }, [userId, pathKey]);

  const onNext = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, finish]);

  const onPrev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
  const onSkip = useCallback(() => finish(), [finish]);

  return (
    <Spotlight
      steps={steps}
      stepIndex={stepIndex}
      open={open}
      onNext={onNext}
      onPrev={onPrev}
      onSkip={onSkip}
    />
  );
}

export function TutorialPlayer() {
  return (
    <Suspense fallback={null}>
      <PlayerInner />
    </Suspense>
  );
}
