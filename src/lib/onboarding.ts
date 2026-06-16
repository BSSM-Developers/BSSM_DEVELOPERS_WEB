/**
 * 온보딩(스포트라이트 튜토리얼) 1회성 표시 관리.
 * localStorage에 사용자별로 "이미 본 튜토리얼"을 기록한다.
 * 키: onboarding_<userId>_<tutorialId>
 */

const PREFIX = "onboarding";

/**
 * 현재 로그인 사용자 id를 구한다.
 * sessionStorage accessToken(JWT)의 sub 클레임에서 추출. (store가 비어도 동작)
 */
export const getCurrentUserId = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return null;
    const part = token.split(".")[1];
    if (!part) return null;
    const norm = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (norm.length % 4)) % 4);
    const payload = JSON.parse(atob(norm + pad)) as { sub?: string | number };
    return payload.sub != null ? String(payload.sub) : null;
  } catch {
    return null;
  }
};

const makeKey = (userId: string | number, tutorialId: string) =>
  `${PREFIX}_${userId}_${tutorialId}`;

/** 해당 사용자가 이 튜토리얼을 이미 봤는지 */
export const isTutorialSeen = (
  userId: string | number | null | undefined,
  tutorialId: string
): boolean => {
  if (typeof window === "undefined" || userId == null) return true; // 비로그인/SSR → 띄우지 않음
  try {
    return localStorage.getItem(makeKey(userId, tutorialId)) === "1";
  } catch {
    return true;
  }
};

/** 모든 사용자의 onboarding 기록 삭제 (dev 재현용) */
export const clearAllSeen = (): void => {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${PREFIX}_`));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

/** 이 튜토리얼을 봤다고 기록 */
export const markTutorialSeen = (
  userId: string | number | null | undefined,
  tutorialId: string
): void => {
  if (typeof window === "undefined" || userId == null) return;
  try {
    localStorage.setItem(makeKey(userId, tutorialId), "1");
  } catch {
    /* ignore */
  }
};
