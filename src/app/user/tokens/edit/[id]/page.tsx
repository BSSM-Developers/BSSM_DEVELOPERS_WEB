"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  useState,
  useCallback,
  useEffect,
  Suspense,
  useRef,
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { tokenApi } from "../../api";
import { SingleInputActionForm } from "@/components/common/SingleInputActionForm";
import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";
import {
  getPlaceholderText,
  getSubtitleText,
  getSuccessText,
  getTitleText,
  parseTokenId,
  type TokenEditStep,
} from "./model";
import {
  CheckCircle,
  CheckIcon,
  Container,
  FlexColumn,
  MainTitle,
  PrimaryButton,
} from "./styles";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { useConfirm } from "@/hooks/useConfirm";

const parseOrigins = (value: string): string[] => {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    )
  );
};

const mergeOrigins = (current: string[], incoming: string[]): string[] => {
  if (incoming.length === 0) {
    return current;
  }
  const seen = new Set(current);
  const merged = [...current];
  incoming.forEach((origin) => {
    if (!seen.has(origin)) {
      seen.add(origin);
      merged.push(origin);
    }
  });
  return merged;
};

const normalizeOriginsForCompare = (value: string[]): string[] => {
  return Array.from(
    new Set(
      value
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    )
  ).sort();
};

const isSameOrigins = (before: string[], after: string[]): boolean => {
  if (before.length !== after.length) {
    return false;
  }
  return before.every((origin, index) => origin === after[index]);
};

const splitOriginDraft = (value: string): { committed: string[]; remaining: string } => {
  if (!/[\n,]/.test(value)) {
    return { committed: [], remaining: value };
  }
  const endsWithDelimiter = /[\n,]\s*$/.test(value);
  const parts = value
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (endsWithDelimiter) {
    return { committed: parts, remaining: "" };
  }
  const remaining = parts.pop() ?? "";
  return { committed: parts, remaining };
};

function TokenEditContent() {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const { id } = useParams();
  const tokenId = parseTokenId(id);
  const searchParams = useSearchParams();
  const initialStep = searchParams.get("step");
  const apiIdParam = searchParams.get("apiId") ?? searchParams.get("usageId");

  const [step, setStep] = useState<TokenEditStep>("TOKEN_NAME");
  const [tokenName, setTokenName] = useState("");
  const [usageName, setUsageName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [origins, setOrigins] = useState<string[]>([]);
  const [originDraft, setOriginDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const originInputRef = useRef<HTMLInputElement | null>(null);
  const initialTokenNameRef = useRef("");
  const initialUsageNameRef = useRef("");
  const initialEndpointRef = useRef("");
  const initialOriginsRef = useRef<string[]>([]);

  useEffect(() => {
    if (initialStep === "ENDPOINT") {
      setStep("ENDPOINT");
      return;
    }
    if (initialStep === "USAGE_NAME") {
      setStep("USAGE_NAME");
      return;
    }
    if (initialStep === "ORIGINS") {
      setStep("ORIGINS");
      return;
    }
    setStep("TOKEN_NAME");
  }, [initialStep]);

  useEffect(() => {
    const loadDetail = async () => {
      if (tokenId === null) {
        setErrorMessage("유효하지 않은 토큰 ID입니다.");
        setIsLoadingDetail(false);
        return;
      }
      try {
        setErrorMessage("");
        setIsLoadingDetail(true);
        const detail = await tokenApi.getDetail(tokenId);
        setTokenName(detail.apiTokenName);
        setOrigins(detail.origins);
        setOriginDraft("");
        const targetUsage = apiIdParam
          ? detail.registeredApis.find(
              (apiUsage) =>
                String(apiUsage.apiId) === apiIdParam || String(apiUsage.apiUsageId ?? "") === apiIdParam
            )
          : detail.registeredApis[0];
        setUsageName(targetUsage?.name ?? "");
        setEndpoint(targetUsage?.endpoint ?? "");
        initialTokenNameRef.current = detail.apiTokenName;
        initialOriginsRef.current = detail.origins;
        initialUsageNameRef.current = targetUsage?.name ?? "";
        initialEndpointRef.current = targetUsage?.endpoint ?? "";
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "토큰 정보를 불러오지 못했습니다.";
        setErrorMessage("토큰 정보를 불러오지 못했습니다.");
        await confirm({
          title: "조회 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void loadDetail();
  }, [apiIdParam, confirm, tokenId]);

  const handleNext = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (tokenId === null) {
      setErrorMessage("유효하지 않은 토큰 ID입니다.");
      return;
    }

    if (step === "TOKEN_NAME") {
      const nextTokenName = tokenName.trim();
      if (!nextTokenName) {
        setErrorMessage("토큰 이름을 입력해주세요.");
        return;
      }
      if (nextTokenName === initialTokenNameRef.current.trim()) {
        setErrorMessage("");
        await confirm({
          title: "변경 없음",
          message: "변경된 내용이 없습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }
      try {
        setErrorMessage("");
        setIsSubmitting(true);
        await tokenApi.updateName(tokenId, nextTokenName);
        setStep("SUCCESS");
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "토큰 이름 수정에 실패했습니다.";
        await confirm({
          title: "수정 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (step === "ORIGINS") {
      const originsToSubmit = mergeOrigins(origins, parseOrigins(originDraft));
      setOrigins(originsToSubmit);
      setOriginDraft("");

      const before = normalizeOriginsForCompare(initialOriginsRef.current);
      const after = normalizeOriginsForCompare(originsToSubmit);
      if (isSameOrigins(before, after)) {
        setErrorMessage("");
        await confirm({
          title: "변경 없음",
          message: "변경된 내용이 없습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }

      try {
        setErrorMessage("");
        setIsSubmitting(true);
        await tokenApi.updateOrigins(tokenId, originsToSubmit);
        setStep("SUCCESS");
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "허용 origin 수정에 실패했습니다.";
        await confirm({
          title: "수정 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!apiIdParam) {
      setErrorMessage("유효하지 않은 API ID입니다.");
      return;
    }

    if (step === "USAGE_NAME") {
      const nextUsageName = usageName.trim();
      if (!nextUsageName) {
        setErrorMessage("API 이름을 입력해주세요.");
        return;
      }
      if (nextUsageName === initialUsageNameRef.current.trim()) {
        setErrorMessage("");
        await confirm({
          title: "변경 없음",
          message: "변경된 내용이 없습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }
      try {
        setErrorMessage("");
        setIsSubmitting(true);
        await tokenApi.updateUsageName(apiIdParam, tokenId, nextUsageName);
        setStep("SUCCESS");
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "API 이름 수정에 실패했습니다.";
        await confirm({
          title: "수정 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const nextEndpoint = endpoint.trim();
    if (!nextEndpoint) {
      setErrorMessage("새로운 엔드포인트를 입력해주세요.");
      return;
    }
    if (nextEndpoint === initialEndpointRef.current.trim()) {
      setErrorMessage("");
      await confirm({
        title: "변경 없음",
        message: "변경된 내용이 없습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);
      await tokenApi.updateUsageEndpoint(apiIdParam, tokenId, nextEndpoint);
      setStep("SUCCESS");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "엔드포인트 수정에 실패했습니다.";
      await confirm({
        title: "수정 실패",
        message,
        confirmText: "확인",
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiIdParam, confirm, endpoint, isSubmitting, originDraft, origins, step, tokenId, tokenName, usageName]);

  const titleText = getTitleText(step);
  const subtitleText = getSubtitleText(step);
  const placeholderText = getPlaceholderText(step);
  const inputValue = step === "TOKEN_NAME" ? tokenName : step === "USAGE_NAME" ? usageName : endpoint;
  const inputLabel = step === "TOKEN_NAME" ? "토큰 이름" : step === "USAGE_NAME" ? "API 이름" : "엔드포인트";

  const handleInputChange = (value: string) => {
    if (step === "TOKEN_NAME") {
      setTokenName(value);
      return;
    }
    if (step === "USAGE_NAME") {
      setUsageName(value);
      return;
    }
    setEndpoint(value);
  };

  const successText = getSuccessText(step);

  const handleOriginInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { committed, remaining } = splitOriginDraft(event.target.value);
    if (committed.length > 0) {
      setOrigins((prevOrigins) => mergeOrigins(prevOrigins, committed));
    }
    setOriginDraft(remaining);
  }, []);

  const commitOriginDraft = useCallback(() => {
    const committed = parseOrigins(originDraft);
    if (committed.length === 0) {
      setOriginDraft((prevDraft) => prevDraft.trim());
      return;
    }
    setOrigins((prevOrigins) => mergeOrigins(prevOrigins, committed));
    setOriginDraft("");
  }, [originDraft]);

  const handleOriginInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "," || event.key === "Enter") {
        event.preventDefault();
        commitOriginDraft();
        return;
      }
      if (event.key === "Backspace" && originDraft.length === 0) {
        setOrigins((prevOrigins) => prevOrigins.slice(0, -1));
      }
    },
    [commitOriginDraft, originDraft.length]
  );

  const handleOriginPaste = useCallback((event: ReactClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");
    const pastedOrigins = parseOrigins(pastedText);
    if (pastedOrigins.length === 0) {
      return;
    }
    event.preventDefault();
    setOrigins((prevOrigins) => mergeOrigins(prevOrigins, pastedOrigins));
    setOriginDraft("");
  }, []);

  const handleOriginRemove = useCallback((targetOrigin: string) => {
    setOrigins((prevOrigins) => prevOrigins.filter((origin) => origin !== targetOrigin));
  }, []);

  const handleComplete = useCallback(() => {
    if (tokenId === null) {
      router.push("/user/tokens");
      return;
    }
    router.push(`/user/tokens/${tokenId}`);
  }, [router, tokenId]);

  if (step === "SUCCESS") {
    return (
      <Container center>
        <FlexColumn center animated>
          <MainTitle>{successText}</MainTitle>
          <CheckCircle>
            <CheckIcon viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </CheckIcon>
          </CheckCircle>
          <PrimaryButton onClick={handleComplete}>완료</PrimaryButton>
        </FlexColumn>
        {ConfirmDialog}
      </Container>
    );
  }

  if (step === "ORIGINS") {
    return (
      <Container center>
        <FlexColumn center animated>
          <MainTitle>{titleText}</MainTitle>
          <OriginSubtitle>{subtitleText}</OriginSubtitle>
          {isLoadingDetail ? <BsdevLoader label="토큰 정보를 불러오는 중입니다..." size={52} minHeight="140px" /> : null}
          {!isLoadingDetail ? (
            <>
              <OriginInputContainer onClick={() => originInputRef.current?.focus()}>
                {origins.map((origin) => (
                  <OriginChip key={origin}>
                    <OriginChipText>{origin}</OriginChipText>
                    <OriginChipDeleteButton
                      type="button"
                      onClick={() => handleOriginRemove(origin)}
                      aria-label={`${origin} 삭제`}
                    >
                      ×
                    </OriginChipDeleteButton>
                  </OriginChip>
                ))}
                <OriginInlineInput
                  ref={originInputRef}
                  value={originDraft}
                  onChange={handleOriginInputChange}
                  onKeyDown={handleOriginInputKeyDown}
                  onPaste={handleOriginPaste}
                  onBlur={commitOriginDraft}
                  placeholder={origins.length === 0 ? placeholderText : "origin을 입력해 추가해 주세요"}
                />
              </OriginInputContainer>
              {errorMessage ? <OriginError>{errorMessage}</OriginError> : null}
              <PrimaryButton onClick={() => void handleNext()} disabled={isSubmitting}>
                {isSubmitting ? "수정 중..." : "수정하기"}
              </PrimaryButton>
            </>
          ) : null}
        </FlexColumn>
        {ConfirmDialog}
      </Container>
    );
  }

  return (
    <Container center>
      <SingleInputActionForm
        title={titleText}
        subtitle={subtitleText}
        label={inputLabel}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholderText}
        onSubmit={() => void handleNext()}
        submitText="수정하기"
        submittingText="수정 중..."
        isSubmitting={isSubmitting}
        isDisabled={isLoadingDetail}
        statusText={isLoadingDetail ? "토큰 정보를 불러오는 중입니다." : undefined}
        errorText={errorMessage || undefined}
        maxWidth="800px"
        animated
      />
      {ConfirmDialog}
    </Container>
  );
}

export default function TokenEditPage() {
  return (
    <Suspense fallback={<BsdevLoader fullScreen label="토큰 수정 페이지를 불러오는 중입니다..." />}>
      <TokenEditContent />
    </Suspense>
  );
}

const OriginSubtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_3")};
  color: ${({ theme }) => theme.colors.grey[500]};
  text-align: center;
  margin-bottom: 18px;
`;

const OriginInputContainer = styled.div`
  color-scheme: light;
  width: 100%;
  min-height: 168px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  background: #ffffff;
  padding: 14px 16px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 8px;
  margin-bottom: 10px;
  outline: none;
  cursor: text;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

const OriginInlineInput = styled.input`
  flex: 1 0 300px;
  min-width: 220px;
  border: none;
  background: transparent;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: #111827;
  -webkit-text-fill-color: #111827;
  caret-color: #111827;
  outline: none;
  padding: 8px 0;

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[400]};
    -webkit-text-fill-color: ${({ theme }) => theme.colors.grey[400]};
    opacity: 1;
  }
`;

const OriginChip = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  background: ${({ theme }) => theme.colors.grey[50]};
`;

const OriginChipText = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
`;

const OriginChipDeleteButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};

  &:hover {
    color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;

const OriginError = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: #d32f2f;
  margin-bottom: 14px;
`;
