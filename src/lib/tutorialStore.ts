/**
 * 튜토리얼 정의 저장소.
 * 코드 기본값(fallback)을 두되, dev 편집 모드에서 만든 정의는 localStorage에 오버라이드 저장.
 * 런타임은 항상 getStepsForPath(코드기본값)으로 해석한다.
 */

import type { TutorialStep } from "@/components/onboarding/Spotlight";

const DEF_PREFIX = "tutorial_def"; // 정의(스텝) 오버라이드

/** 동적 라우트 정규화: 숫자/긴 슬러그 세그먼트를 [id]로 치환해 페이지키 안정화 */
export const normalizePath = (pathname: string): string => {
  if (!pathname) return "/";
  return (
    pathname
      .split("/")
      .map((seg) => {
        if (!seg) return seg;
        if (/^\d+$/.test(seg)) return "[id]"; // 순수 숫자
        if (/^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(seg)) return "[id]"; // uuid
        return seg;
      })
      .join("/") || "/"
  );
};

const defKey = (pathKey: string) => `${DEF_PREFIX}_${pathKey}`;

/** 오버라이드가 있으면 그것, 없으면 코드 기본값(fallback) */
export const getStepsForPath = (
  pathKey: string,
  fallback: TutorialStep[]
): TutorialStep[] => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(defKey(pathKey));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as TutorialStep[];
    if (Array.isArray(parsed)) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
};

/** dev 편집: 현재 페이지 스텝 전체 저장(오버라이드 생성) */
export const saveStepsForPath = (pathKey: string, steps: TutorialStep[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(defKey(pathKey), JSON.stringify(steps));
  } catch {
    /* ignore */
  }
};

/** dev 편집: 오버라이드 제거(코드 기본값으로 복귀) */
export const resetPath = (pathKey: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(defKey(pathKey));
  } catch {
    /* ignore */
  }
};

/** 오버라이드가 존재하는지 */
export const hasOverride = (pathKey: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(defKey(pathKey)) != null;
  } catch {
    return false;
  }
};
