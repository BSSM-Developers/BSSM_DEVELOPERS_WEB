"use client";

import React from "react";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { BsdevSelect } from "@/components/ui/BsdevSelect";
import { ApiCard } from "@/components/apis/ApiCard";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import {
  StepContainer,
  LeftPanel,
  RightPanel,
  Header,
  Title,
  Form,
  InputGroup,
  TypeSelector,
  TypeButton,
  CheckboxWrapper,
  Checkbox,
  Footer,
  PrevButton,
  NextButton,
  PreviewCardWrapper,
} from "../styles";

import type { FormData } from "../hooks/useDocsForm";
import {
  useGitHubConnectionQuery,
  useAvailableRepositoriesQuery,
  useBranchesQuery,
} from "@/app/user/github/queries";

const OriginalOnlyFields = styled.div<{ hidden: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 32px;
  opacity: ${({ hidden }) => (hidden ? 0 : 1)};
  pointer-events: ${({ hidden }) => (hidden ? "none" : "auto")};
`;

// ── GitHub 미연동 안내 배너 ──────────────────────────────────
const GuideBanner = styled.div<{ variant?: "warning" | "info" }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: 12px;
  background: ${({ variant }) =>
    variant === "warning"
      ? "rgba(245, 158, 11, 0.07)"
      : "rgba(22, 51, 92, 0.05)"};
  border: 1px solid
    ${({ variant }) =>
      variant === "warning" ? "rgba(245, 158, 11, 0.3)" : "rgba(22, 51, 92, 0.15)"};
`;

const BannerTitle = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const BannerDesc = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const BannerButton = styled.button`
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 8px;
  background: #16335c;
  color: white;
  font-size: 13px;
  font-weight: 700;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  border: none;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1a3a68;
  }
`;

// ── 메인 컴포넌트 ─────────────────────────────────────────────

interface InputStepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string | boolean | number | null) => void;
  handleNext: () => void;
  userName: string;
}

export const InputStep = ({
  formData,
  updateFormData,
  handleNext,
  userName,
}: InputStepProps) => {
  const router = useRouter();
  const isCustom = formData.docsType === "CUSTOM";

  // GitHub 연동 상태
  const {
    data: githubConnection,
    isLoading: isConnectionLoading,
  } = useGitHubConnectionQuery();

  const isGitHubConnected = !!githubConnection;
  const isAppInstalled = githubConnection?.appInstalled === true;

  // App이 설치된 레포 목록 (ORIGINAL + 완전 연동 상태일 때만 활성화)
  const {
    data: repos,
    isLoading: isReposLoading,
  } = useAvailableRepositoriesQuery(!isCustom && isAppInstalled);

  // 선택된 레포의 브랜치 목록
  const {
    data: branches,
    isLoading: isBranchesLoading,
  } = useBranchesQuery(formData.selectedRepoFullName);

  // 레포 선택 핸들러 — 레포 변경 시 브랜치 초기화 + 레포 id 저장(parsed-endpoints용)
  const handleRepoChange = (repoFullName: string) => {
    updateFormData("selectedRepoFullName", repoFullName);
    updateFormData("selectedBranch", ""); // 브랜치 초기화
    const matched = (repos ?? []).find((r) => r.full_name === repoFullName);
    updateFormData("selectedRepoId", matched?.id ?? null);
  };

  // 레포 드롭다운 옵션 (available 응답: full_name / name / private)
  const repoOptions = (repos ?? []).map((r) => ({
    value: r.full_name,
    label: r.full_name,
    tag: r.private ? "private" : "public",
  }));

  // 브랜치 드롭다운 옵션 — main(없으면 master)을 항상 최상단으로
  const branchOptions = [...(branches ?? [])]
    .sort((a, b) => {
      const rank = (n: string) => (n === "main" ? 0 : n === "master" ? 1 : 2);
      const ra = rank(a.name);
      const rb = rank(b.name);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    })
    .map((b) => ({
      value: b.name,
      label: b.name,
      tag: b.protected ? "protected" : undefined,
    }));

  return (
    <StepContainer>
      <LeftPanel>
        <Header>
          <Title>문서 초기 세팅</Title>
        </Header>
        <Form>
          {/* 타입 선택 */}
          <InputGroup>
            <TypeSelector>
              <TypeButton
                type="button"
                selected={formData.docsType === "ORIGINAL"}
                onClick={() => updateFormData("docsType", "ORIGINAL")}
              >
                API 문서
              </TypeButton>
              <TypeButton
                type="button"
                selected={formData.docsType === "CUSTOM"}
                onClick={() => updateFormData("docsType", "CUSTOM")}
              >
                API 폴더집
              </TypeButton>
            </TypeSelector>
          </InputGroup>

          {/* 공통 필드 */}
          <FloatingInput
            label={isCustom ? "API 폴더집 제목" : "API 문서 제목"}
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
          />
          <FloatingInput
            label={isCustom ? "API 폴더집 소개" : "API 문서 소개"}
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
          />

          {/* ORIGINAL 전용 필드 */}
          <OriginalOnlyFields hidden={isCustom}>
            <FloatingInput
              label="도메인 주소"
              value={formData.domain}
              onChange={(e) => updateFormData("domain", e.target.value)}
              placeholder="https://api.example.com"
            />

            {/* GitHub 연동 상태별 UI */}
            {isConnectionLoading ? (
              <BsdevLoader label="GitHub 연동 정보 확인 중..." size={32} minHeight="80px" />
            ) : !isGitHubConnected ? (
              // ① 미연동
              <GuideBanner variant="warning">
                <BannerTitle>⚠ GitHub 연동이 필요합니다</BannerTitle>
                <BannerDesc>
                  Original API 문서를 등록하려면 GitHub 계정 연동이 필요해요.
                  연동 후 레포지토리와 브랜치를 선택할 수 있어요.
                </BannerDesc>
                <BannerButton onClick={() => router.push("/user/github")}>
                  GitHub 연동하러 가기
                </BannerButton>
              </GuideBanner>
            ) : !isAppInstalled ? (
              // ② App 미설치
              <GuideBanner variant="warning">
                <BannerTitle>⚠ GitHub App 설치가 필요합니다</BannerTitle>
                <BannerDesc>
                  GitHub 계정은 연동됐지만 GitHub App 설치가 필요해요.
                  설치를 완료하면 레포지토리를 선택할 수 있어요.
                </BannerDesc>
                <BannerButton onClick={() => router.push("/user/github")}>
                  GitHub App 설치하러 가기
                </BannerButton>
              </GuideBanner>
            ) : isReposLoading ? (
              <BsdevLoader label="레포지토리 목록을 불러오는 중..." size={32} minHeight="80px" />
            ) : !repos || repos.length === 0 ? (
              // ③ 등록된 레포 없음
              <GuideBanner>
                <BannerTitle>등록된 레포지토리가 없습니다</BannerTitle>
                <BannerDesc>
                  문서를 등록하기 전에 레포지토리를 먼저 등록해야 해요.
                </BannerDesc>
                <BannerButton onClick={() => router.push("/user/github")}>
                  레포지토리 등록하러 가기
                </BannerButton>
              </GuideBanner>
            ) : (
              // ④ 레포 + 브랜치 선택 드롭다운 (BSDev 커스텀 셀렉트)
              <>
                <BsdevSelect
                  label="레포지토리"
                  value={formData.selectedRepoFullName}
                  onChange={handleRepoChange}
                  options={repoOptions}
                  placeholder="저장소를 선택하세요"
                  searchable
                  searchPlaceholder="저장소 검색..."
                />
                {isBranchesLoading ? (
                  <BsdevLoader label="브랜치 목록을 불러오는 중..." size={28} minHeight="60px" />
                ) : (
                  <BsdevSelect
                    label="브랜치"
                    value={formData.selectedBranch}
                    onChange={(val) => updateFormData("selectedBranch", val)}
                    options={branchOptions}
                    disabled={!formData.selectedRepoFullName}
                    searchable
                    searchPlaceholder="브랜치 검색..."
                    placeholder={
                      formData.selectedRepoFullName
                        ? "브랜치를 선택하세요"
                        : "레포지토리를 먼저 선택하세요"
                    }
                  />
                )}
              </>
            )}

            {/* 자동 승인 */}
            <InputGroup
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: "12px",
                padding: "0 4px",
              }}
            >
              <CheckboxWrapper>
                <Checkbox
                  type="checkbox"
                  id="auto_approval"
                  checked={formData.auto_approval}
                  onChange={(e) => updateFormData("auto_approval", e.target.checked)}
                />
              </CheckboxWrapper>
              <label
                htmlFor="auto_approval"
                style={{
                  fontSize: "15px",
                  color: "#374151",
                  cursor: "pointer",
                  fontFamily: '"Spoqa Han Sans Neo", sans-serif',
                }}
              >
                자동 승인 활성화
              </label>
            </InputGroup>
          </OriginalOnlyFields>
        </Form>

        <Footer>
          <PrevButton onClick={() => router.back()}>이전으로</PrevButton>
          <NextButton onClick={handleNext}>
            {isCustom ? "생성하기" : "다음으로"}
          </NextButton>
        </Footer>
      </LeftPanel>

      <RightPanel>
        <PreviewCardWrapper>
          <ApiCard
            id="preview"
            title={formData.title || (isCustom ? "API 폴더집 제목" : "API 문서 제목")}
            description={
              formData.description ||
              (isCustom ? "API 폴더집 소개를 입력해주세요" : "API 문서 소개를 입력해주세요")
            }
            tags={[userName]}
            onExplore={() => {}}
          />
        </PreviewCardWrapper>
      </RightPanel>
    </StepContainer>
  );
};
