export type TokenEditStep = "TOKEN_NAME" | "USAGE_NAME" | "ENDPOINT" | "SUCCESS";

export const parseTokenId = (value: string | string[] | undefined): number | null => {
  if (!value) {
    return null;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getTitleText = (step: TokenEditStep): string => {
  if (step === "TOKEN_NAME") {
    return "수정하고 싶은 토큰 이름을 입력해주세요";
  }
  if (step === "USAGE_NAME") {
    return "수정하고 싶은 API 이름을 입력해주세요";
  }
  return "수정하고 싶은 엔드포인트를 입력해주세요";
};

export const getPlaceholderText = (step: TokenEditStep): string => {
  if (step === "TOKEN_NAME") {
    return "토큰 이름을 입력해주세요";
  }
  if (step === "USAGE_NAME") {
    return "API 이름을 입력해주세요";
  }
  return "엔드포인트를 입력해주세요";
};

export const getSuccessText = (step: TokenEditStep): string => {
  if (step === "TOKEN_NAME") {
    return "토큰 이름 수정이 완료되었습니다!";
  }
  if (step === "USAGE_NAME") {
    return "API 이름 수정이 완료되었습니다!";
  }
  return "API 엔드포인트 수정이 완료되었습니다!";
};
