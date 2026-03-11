"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, Suspense } from "react";
import { tokenApi } from "../../api";
import { SingleInputActionForm } from "@/components/common/SingleInputActionForm";
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

function TokenEditContent() {
  const router = useRouter();
  const { id } = useParams();
  const tokenId = parseTokenId(id);
  const searchParams = useSearchParams();
  const initialStep = searchParams.get("step");
  const apiIdParam = searchParams.get("apiId") ?? searchParams.get("usageId");

  const [step, setStep] = useState<TokenEditStep>("TOKEN_NAME");
  const [tokenName, setTokenName] = useState("");
  const [usageName, setUsageName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialStep === "ENDPOINT") {
      setStep("ENDPOINT");
      return;
    }
    if (initialStep === "USAGE_NAME") {
      setStep("USAGE_NAME");
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
        const targetUsage = apiIdParam
          ? detail.registeredApis.find(
              (apiUsage) =>
                String(apiUsage.apiId) === apiIdParam || String(apiUsage.apiUsageId ?? "") === apiIdParam
            )
          : detail.registeredApis[0];
        setUsageName(targetUsage?.name ?? "");
        setEndpoint(targetUsage?.endpoint ?? "");
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "토큰 정보를 불러오지 못했습니다.";
        setErrorMessage(message);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void loadDetail();
  }, [apiIdParam, tokenId]);

  const handleNext = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (tokenId === null) {
      setErrorMessage("유효하지 않은 토큰 ID입니다.");
      return;
    }

    if (step === "TOKEN_NAME") {
      if (!tokenName.trim()) {
        setErrorMessage("토큰 이름을 입력해주세요.");
        return;
      }
      try {
        setErrorMessage("");
        setIsSubmitting(true);
        await tokenApi.updateName(tokenId, tokenName.trim());
        setStep("SUCCESS");
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "토큰 이름 수정에 실패했습니다.";
        setErrorMessage(message);
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
      if (!usageName.trim()) {
        setErrorMessage("API 이름을 입력해주세요.");
        return;
      }
      try {
        setErrorMessage("");
        setIsSubmitting(true);
        await tokenApi.updateUsageName(apiIdParam, tokenId, usageName.trim());
        setStep("SUCCESS");
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "API 이름 수정에 실패했습니다.";
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!endpoint.trim()) {
      setErrorMessage("엔드포인트를 입력해주세요.");
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);
      await tokenApi.updateUsageEndpoint(apiIdParam, tokenId, endpoint.trim());
      setStep("SUCCESS");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "엔드포인트 수정에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [apiIdParam, endpoint, isSubmitting, step, tokenId, tokenName, usageName]);

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
    </Container>
  );
}

export default function TokenEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TokenEditContent />
    </Suspense>
  );
}
