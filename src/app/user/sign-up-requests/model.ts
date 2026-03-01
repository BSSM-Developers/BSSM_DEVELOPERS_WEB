import type { SignUpRequestItem } from "./api";

export const isAdminRole = (role?: string): boolean => role === "ADMIN" || role === "ROLE_ADMIN";

export const resolveRequestId = (request: SignUpRequestItem): number | null => {
  const raw = request.signupRequestId ?? request.signupFormId;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

export const createSignUpRequestKey = (request: SignUpRequestItem): string => {
  const requestId = resolveRequestId(request);
  return `${requestId ?? "unknown"}-${request.signupFormId ?? "no-form"}-${request.email ?? "no-email"}`;
};
