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
    <ModalOverlay onClick={onClose}>
      <ModalCard onClick={(event) => event.stopPropagation()}>
        <ModalTitle>API 사용 신청</ModalTitle>
        <ModalDescription>API 사용 신청 정보를 작성해주세요.</ModalDescription>

        <Field>
          <FieldLabel>문서</FieldLabel>
          <StaticValue>{docsTitle || "-"}</StaticValue>
        </Field>

        <Field>
          <FieldLabel>신청 대상 API</FieldLabel>
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

const modalDropDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-44px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 560px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  animation: ${modalDropDown} 460ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const ModalTitle = styled.h2`
  margin: 0 0 8px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`;

const ModalDescription = styled.p`
  margin: 0 0 20px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #6b7280;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const FieldLabel = styled.label`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
`;

const StaticValue = styled.div`
  height: 42px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #111827;
`;

const SelectContainer = styled.div`
  position: relative;
`;

const SelectTrigger = styled.button`
  width: 100%;
  height: 42px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    border-color: #16335c;
    box-shadow: 0 0 0 2px rgba(22, 51, 92, 0.12);
  }
`;

const TriggerText = styled.span<{ hasValue: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: ${({ hasValue }) => (hasValue ? "#111827" : "#6b7280")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Arrow = styled.span<{ isOpen: boolean }>`
  font-size: 12px;
  color: #6b7280;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 180ms ease;
`;

const SelectMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
  z-index: 20;
  max-height: 240px;
  overflow: auto;
`;

const SelectOption = styled.button<{ selected: boolean }>`
  width: 100%;
  border: none;
  background: ${({ selected }) => (selected ? "rgba(22, 51, 92, 0.08)" : "white")};
  padding: 11px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #111827;
  cursor: pointer;

  &:hover {
    background: rgba(22, 51, 92, 0.08);
  }
`;

const SecondaryText = styled.span`
  color: #6b7280;
  font-size: 12px;
  flex-shrink: 0;
`;

const ReasonInput = styled.textarea`
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  padding: 12px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #111827;
  outline: none;
  resize: vertical;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #16335c;
  }
`;

const InlineError = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #dc2626;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`;

const ModalButton = styled.button<{ primary?: boolean }>`
  height: 38px;
  border-radius: 8px;
  padding: 0 14px;
  border: 1px solid ${({ primary }) => (primary ? "#16335c" : "#d1d5db")};
  background: ${({ primary }) => (primary ? "#16335c" : "white")};
  color: ${({ primary }) => (primary ? "white" : "#374151")};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
