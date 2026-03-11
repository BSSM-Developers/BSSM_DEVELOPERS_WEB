"use client";

import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { docsApi, type SidebarBlock } from "@/app/docs/api";
import { apiUseReasonApi } from "@/app/apis/useReasonApi";
import { tokenApi, type ApiTokenListItem } from "@/app/user/tokens/api";
import { useConfirm } from "@/hooks/useConfirm";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ApiUseTarget {
  id: string;
  label: string;
  mappedId: string;
}

interface ApiUseApplyModalProps {
  isOpen: boolean;
  docsId: string | null;
  docsTitle?: string;
  defaultMappedId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const collectApiTargets = (blocks: SidebarBlock[]): ApiUseTarget[] => {
  const result: ApiUseTarget[] = [];

  const traverse = (items: SidebarBlock[]) => {
    for (const block of items) {
      if (block.module === "api" && block.id) {
        const mappedId = block.mappedId || "";
        if (!mappedId) {
          continue;
        }
        result.push({
          id: block.id,
          label: block.label || "이름 없는 API",
          mappedId,
        });
      }
      if (block.childrenItems?.length) {
        traverse(block.childrenItems);
      }
    }
  };

  traverse(blocks);
  return result;
};

export function ApiUseApplyModal({
  isOpen,
  docsId,
  docsTitle,
  defaultMappedId,
  onClose,
  onSuccess,
}: ApiUseApplyModalProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [selectedApiId, setSelectedApiId] = useState("");
  const [apiUseReason, setApiUseReason] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const [isApiMenuOpen, setIsApiMenuOpen] = useState(false);

  const tokenMenuRef = useRef<HTMLDivElement>(null);
  const apiMenuRef = useRef<HTMLDivElement>(null);
  const isOverlayPressedRef = useRef(false);

  const tokensQuery = useQuery({
    queryKey: ["api-use-apply-modal", "tokens"],
    queryFn: async () => {
      const response = await tokenApi.getList(undefined, 50);
      return response.values;
    },
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  const apiTargetsQuery = useQuery({
    queryKey: ["api-use-apply-modal", "targets", docsId],
    queryFn: async () => {
      if (!docsId) {
        return [];
      }
      const response = await docsApi.getSidebar(docsId);
      return collectApiTargets(response.data.blocks || []);
    },
    enabled: isOpen && !!docsId,
    staleTime: 60 * 1000,
  });

  const tokens: ApiTokenListItem[] = useMemo(() => tokensQuery.data ?? [], [tokensQuery.data]);
  const apiTargets: ApiUseTarget[] = useMemo(() => apiTargetsQuery.data ?? [], [apiTargetsQuery.data]);
  const isTokensLoading = tokensQuery.isLoading;
  const isTargetsLoading = apiTargetsQuery.isLoading;
  const tokenError = tokensQuery.error instanceof Error ? tokensQuery.error.message : "";
  const apiTargetError =
    apiTargetsQuery.error instanceof Error
      ? apiTargetsQuery.error.message
      : !isTargetsLoading && isOpen && Boolean(docsId) && apiTargets.length === 0
        ? "신청 가능한 API 항목이 없습니다."
        : "";

  const selectedToken = useMemo(
    () => tokens.find((token) => String(token.apiTokenId) === selectedTokenId) ?? null,
    [selectedTokenId, tokens]
  );
  const selectedApiTarget = useMemo(
    () => apiTargets.find((target) => target.id === selectedApiId) ?? null,
    [apiTargets, selectedApiId]
  );

  useEffect(() => {
    if (!isOpen) {
      setIsTokenMenuOpen(false);
      setIsApiMenuOpen(false);
      return;
    }

    setSelectedTokenId("");
    setSelectedApiId("");
    setApiUseReason("");
    setSubmitError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (apiTargets.length === 0) {
      setSelectedApiId("");
      return;
    }

    const byCurrentPage =
      defaultMappedId
        ? apiTargets.find((target) => target.mappedId === defaultMappedId || target.id === defaultMappedId)
        : null;

    if (byCurrentPage) {
      setSelectedApiId(byCurrentPage.id);
      return;
    }

    setSelectedApiId((prev) => (apiTargets.some((target) => target.id === prev) ? prev : apiTargets[0].id));
  }, [apiTargets, defaultMappedId, isOpen]);

  useEffect(() => {
    if (!isOpen || (!isTokenMenuOpen && !isApiMenuOpen)) {
      return;
    }

    const handleOutside = (event: MouseEvent) => {
      const node = event.target as Node;
      if (isTokenMenuOpen && tokenMenuRef.current && !tokenMenuRef.current.contains(node)) {
        setIsTokenMenuOpen(false);
      }
      if (isApiMenuOpen && apiMenuRef.current && !apiMenuRef.current.contains(node)) {
        setIsApiMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTokenMenuOpen(false);
        setIsApiMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isApiMenuOpen, isOpen, isTokenMenuOpen]);

  const handleSubmit = useCallback(async () => {
    if (!docsId) {
      setSubmitError("유효한 문서 정보가 아닙니다.");
      return;
    }
    if (!selectedToken) {
      setSubmitError("사용할 토큰을 선택해주세요.");
      return;
    }
    if (!selectedApiTarget) {
      setSubmitError("신청할 API를 선택해주세요.");
      return;
    }
    if (!apiUseReason.trim()) {
      setSubmitError("API 사용 목적을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      const pageResponse = await docsApi.getPage(docsId, selectedApiTarget.mappedId);
      const pageId = pageResponse?.data?.id;
      if (!pageId) {
        setSubmitError("신청 대상 API 정보를 확인할 수 없습니다.");
        return;
      }

      await apiUseReasonApi.create(selectedToken.apiTokenId, pageId, apiUseReason.trim());
      await confirm({
        title: "신청 완료",
        message: "API 사용 신청이 완료되었습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      onClose();
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "API 사용 신청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [apiUseReason, confirm, docsId, onClose, onSuccess, selectedApiTarget, selectedToken]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <ModalOverlay
      onMouseDown={(event) => {
        isOverlayPressedRef.current = event.target === event.currentTarget;
      }}
      onMouseUp={(event) => {
        const isOverlayTarget = event.target === event.currentTarget;
        if (isOverlayPressedRef.current && isOverlayTarget) {
          onClose();
        }
        isOverlayPressedRef.current = false;
      }}
      onMouseLeave={() => {
        isOverlayPressedRef.current = false;
      }}
    >
      <ModalCard onClick={(event) => event.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>API 사용 신청</ModalTitle>
          <ModalDescription>문서 확인 후 필요한 API를 선택하고 신청 사유를 남겨주세요.</ModalDescription>
        </ModalHeader>

        <Field>
          <FieldLabel>문서</FieldLabel>
          <StaticValue>{docsTitle || "-"}</StaticValue>
        </Field>

        <Field>
          <FieldLabel>신청 API</FieldLabel>
          <SelectContainer ref={apiMenuRef}>
            <SelectTrigger
              type="button"
              onClick={() => {
                if (isTargetsLoading || apiTargets.length === 0) {
                  return;
                }
                setIsApiMenuOpen((prev) => !prev);
              }}
              disabled={isTargetsLoading || apiTargets.length === 0}
              aria-expanded={isApiMenuOpen}
            >
              <TriggerText hasValue={Boolean(selectedApiTarget)}>
                {isTargetsLoading
                  ? "API 목록을 불러오는 중..."
                  : selectedApiTarget
                    ? selectedApiTarget.label
                    : apiTargets.length > 0
                      ? "신청할 API를 선택해주세요"
                      : "신청 가능한 API가 없습니다"}
              </TriggerText>
              <Arrow isOpen={isApiMenuOpen}>▼</Arrow>
            </SelectTrigger>
            {isApiMenuOpen && apiTargets.length > 0 ? (
              <SelectMenu role="listbox">
                {apiTargets.map((target) => {
                  const isSelected = target.id === selectedApiId;
                  return (
                    <SelectOption
                      key={target.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      selected={isSelected}
                      onClick={() => {
                        setSelectedApiId(target.id);
                        setIsApiMenuOpen(false);
                      }}
                    >
                      {target.label}
                    </SelectOption>
                  );
                })}
              </SelectMenu>
            ) : null}
          </SelectContainer>
          {apiTargetError ? <InlineError>{apiTargetError}</InlineError> : null}
        </Field>

        <Field>
          <FieldLabel>사용할 토큰</FieldLabel>
          <SelectContainer ref={tokenMenuRef}>
            <SelectTrigger
              type="button"
              onClick={() => {
                if (isTokensLoading || tokens.length === 0) {
                  return;
                }
                setIsTokenMenuOpen((prev) => !prev);
              }}
              disabled={isTokensLoading || tokens.length === 0}
              aria-expanded={isTokenMenuOpen}
            >
              <TriggerText hasValue={Boolean(selectedToken)}>
                {isTokensLoading
                  ? "토큰 불러오는 중..."
                  : selectedToken
                    ? `${selectedToken.apiTokenName} (${selectedToken.apiTokenClientId})`
                    : tokens.length > 0
                      ? "토큰을 선택해주세요"
                      : "발급된 토큰이 없습니다"}
              </TriggerText>
              <Arrow isOpen={isTokenMenuOpen}>▼</Arrow>
            </SelectTrigger>
            {isTokenMenuOpen && tokens.length > 0 ? (
              <SelectMenu role="listbox">
                {tokens.map((token) => {
                  const value = String(token.apiTokenId);
                  const isSelected = value === selectedTokenId;
                  return (
                    <SelectOption
                      key={token.apiTokenId}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      selected={isSelected}
                      onClick={() => {
                        setSelectedTokenId(value);
                        setIsTokenMenuOpen(false);
                      }}
                    >
                      <span>{token.apiTokenName}</span>
                      <SecondaryText>{token.apiTokenClientId}</SecondaryText>
                    </SelectOption>
                  );
                })}
              </SelectMenu>
            ) : null}
          </SelectContainer>
          {tokenError ? <InlineError>{tokenError}</InlineError> : null}
        </Field>

        <Field>
          <FieldLabel>사용 목적</FieldLabel>
          <ReasonInput
            value={apiUseReason}
            onChange={(event) => setApiUseReason(event.target.value)}
            placeholder="예: 앱에서 사용자 프로필 조회 기능 제공을 위해 사용합니다."
            rows={5}
          />
        </Field>

        {submitError ? <InlineError>{submitError}</InlineError> : null}

        <ActionRow>
          <ModalButton type="button" onClick={onClose}>
            취소
          </ModalButton>
          <ModalButton type="button" primary onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "신청 중..." : "신청하기"}
          </ModalButton>
        </ActionRow>
      </ModalCard>
      {ConfirmDialog}
    </ModalOverlay>,
    document.body
  );
}

const overlayFadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const modalEntrance = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.965);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 16, 33, 0.58);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
  animation: ${overlayFadeIn} 240ms ease-out;
`;

const ModalCard = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 620px;
  background: white;
  border-radius: 18px;
  border: 1px solid #d4ddec;
  box-shadow: 0 26px 62px rgba(7, 23, 55, 0.25);
  padding: 28px;
  animation: ${modalEntrance} 300ms cubic-bezier(0.2, 0.9, 0.2, 1);
`;

const ModalHeader = styled.div`
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  margin: 0 0 6px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
`;

const ModalDescription = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  color: #5f6b7f;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 18px;
`;

const FieldLabel = styled.label`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
`;

const StaticValue = styled.div`
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid #cfd8ea;
  background: #f7faff;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  color: #14233e;
`;

const SelectContainer = styled.div`
  position: relative;
`;

const SelectTrigger = styled.button`
  width: 100%;
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid #cfd8ea;
  padding: 10px 14px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;

  &:disabled {
    background: #f5f7fb;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    border-color: #274f86;
    box-shadow: 0 0 0 3px rgba(39, 79, 134, 0.16);
  }
`;

const TriggerText = styled.span<{ hasValue: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  color: ${({ hasValue }) => (hasValue ? "#111827" : "#667085")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Arrow = styled.span<{ isOpen: boolean }>`
  font-size: 12px;
  color: #5f6b7f;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 180ms ease;
`;

const SelectMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccd7eb;
  border-radius: 10px;
  box-shadow: 0 14px 30px rgba(8, 22, 50, 0.16);
  z-index: 20;
  max-height: 240px;
  overflow: auto;
`;

const SelectOption = styled.button<{ selected: boolean }>`
  width: 100%;
  border: none;
  background: ${({ selected }) => (selected ? "#eef4ff" : "white")};
  padding: 11px 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  color: #101828;
  cursor: pointer;

  &:hover {
    background: #eef4ff;
  }
`;

const SecondaryText = styled.span`
  color: #667085;
  font-size: 12px;
  flex-shrink: 0;
`;

const ReasonInput = styled.textarea`
  min-height: 124px;
  border-radius: 10px;
  border: 1px solid #cfd8ea;
  background: white;
  padding: 12px 14px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  color: #101828;
  outline: none;
  resize: vertical;

  &::placeholder {
    color: #98a2b3;
  }

  &:focus {
    border-color: #274f86;
    box-shadow: 0 0 0 3px rgba(39, 79, 134, 0.16);
  }
`;

const InlineError = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #c53333;
  background: #fff3f2;
  border: 1px solid #ffd2ce;
  border-radius: 8px;
  padding: 10px 12px;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
`;

const ModalButton = styled.button<{ primary?: boolean }>`
  min-width: 116px;
  height: 44px;
  border-radius: 10px;
  padding: 0 16px;
  border: 1px solid ${({ primary }) => (primary ? "#16335c" : "#cfd8ea")};
  background: ${({ primary }) => (primary ? "#16335c" : "#f8fafe")};
  color: ${({ primary }) => (primary ? "white" : "#1f2a44")};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 160ms ease, transform 160ms ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.03);
    transform: translateY(-1px);
  }
`;
