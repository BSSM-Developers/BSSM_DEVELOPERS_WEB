export interface SignUpProfileSnapshot {
  signupFormId?: number | string;
  signupRequestId?: number | string;
  name?: string;
  email?: string;
  profile?: string;
  purpose?: string;
  state?: string;
}

export const getStateLabel = (state?: string): string => {
  if (state === "APPROVED") {
    return "승인됨";
  }
  if (state === "REJECTED") {
    return "거절됨";
  }
  if (state === "PENDING") {
    return "대기 중";
  }
  return "미신청";
};

export const resolveSignUpRequestId = (profileData?: SignUpProfileSnapshot): number | null => {
  const rawSignUpRequestId = profileData?.signupRequestId ?? profileData?.signupFormId;
  const signupRequestId =
    typeof rawSignUpRequestId === "number" ? rawSignUpRequestId : Number(rawSignUpRequestId);

  if (!Number.isFinite(signupRequestId) || signupRequestId <= 0) {
    return null;
  }

  return signupRequestId;
};

export const createApprovedViewedKey = (profileData?: SignUpProfileSnapshot): string => {
  const uniqueKeySeed = String(
    profileData?.signupRequestId ?? profileData?.signupFormId ?? profileData?.email ?? "approved"
  );
  return `signup-approved-viewed:${uniqueKeySeed}`;
};
