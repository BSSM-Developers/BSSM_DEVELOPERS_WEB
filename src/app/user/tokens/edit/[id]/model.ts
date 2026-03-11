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

export const getSubtitleText = (step: TokenEditStep): string => {
  if (step === "TOKEN_NAME") {
    return "변경할 토큰 이름을 입력하고 수정하기를 눌러 저장해 주세요.";
  }
  if (step === "USAGE_NAME") {
    return "사용처에서 구분하기 쉬운 API 이름으로 변경해 주세요.";
  }
  return "실제 요청에 사용할 엔드포인트를 정확히 입력해 주세요.";
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
