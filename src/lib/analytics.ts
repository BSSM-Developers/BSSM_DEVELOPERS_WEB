import posthog from "posthog-js";

/**
 * PostHog 사용자 분석 유틸.
 *
 * - 초기화/페이지뷰/오토캡처는 PostHogProvider 가 담당한다.
 * - 이 모듈은 "수동 이벤트"와 "사용자 식별(identify)" 헬퍼만 제공한다.
 * - 로그인/로그아웃은 `auth-token-changed` 이벤트로 PostHogProvider 가 자동 동기화하므로
 *   콜백 페이지에서 직접 identify 를 호출할 필요는 없다.
 */

export const isAnalyticsEnabled = (): boolean =>
  typeof window !== "undefined" &&
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

interface JwtUserPayload {
  sub?: string | number;
  id?: string | number;
  userId?: string | number;
  user_id?: string | number;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

/** access token(JWT)의 payload 를 디코드한다. 실패 시 null. */
export const decodeJwtPayload = (token: string): JwtUserPayload | null => {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(`${normalized}${padding}`)) as JwtUserPayload;
  } catch {
    return null;
  }
};

/** JWT payload 에서 안정적인 distinct_id 를 고른다. */
const pickDistinctId = (p: JwtUserPayload): string | null => {
  const candidate =
    p.sub ?? p.id ?? p.userId ?? p.user_id ?? p.email ?? p.name ?? null;
  return candidate != null ? String(candidate) : null;
};

/** access token 으로 PostHog 사용자 식별. */
export const identifyFromToken = (token: string | null): void => {
  if (!isAnalyticsEnabled() || !token) return;
  const payload = decodeJwtPayload(token);
  if (!payload) return;

  const distinctId = pickDistinctId(payload);
  if (!distinctId) return;

  const properties: Record<string, unknown> = {};
  if (payload.email) properties.email = payload.email;
  if (payload.name) properties.name = payload.name;
  if (payload.role) properties.role = payload.role;

  posthog.identify(distinctId, properties);
};

/** 로그아웃 시 익명 사용자로 리셋. */
export const resetAnalytics = (): void => {
  if (!isAnalyticsEnabled()) return;
  posthog.reset();
};

/** 수동 커스텀 이벤트. 예: track("github_connect_clicked", { from: "user_page" }) */
export const track = (
  event: string,
  properties?: Record<string, unknown>
): void => {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, properties);
};

export { posthog };
