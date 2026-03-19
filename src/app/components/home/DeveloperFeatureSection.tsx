"use client";

import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

interface DeveloperFeatureSectionProps {
  active: boolean;
}

interface FeatureItem {
  title: string;
  description: string;
  imageSources: readonly string[];
  imagePosition: string;
  imageScale: number;
  imageTransformOrigin: string;
  imageAlt: string;
  captureGuide: string;
  accent: "blue" | "green" | "yellow";
}

const FEATURE_CYCLE_MS = 5000;

const featureItems: readonly FeatureItem[] = [
  {
    title: "파라미터 타입 자동 추론",
    description: "JSON 입력과 예시 값을 바탕으로 string, integer, array, object 타입을 자동 추론해 작성 시간을 줄입니다.",
    imageSources: ["/images/typeAuto1.png"],
    imagePosition: "center center",
    imageScale: 1,
    imageTransformOrigin: "center center",
    imageAlt: "파라미터 타입 자동 추론 미리보기",
    captureGuide: "문서 에디터에서 파라미터 타입이 자동 추론되는 화면",
    accent: "blue",
  },
  {
    title: "JSON 입력 자동 변환",
    description: "JSON을 붙여넣으면 파라미터 스키마를 자동으로 생성하고, 기존 필수/설명 설정을 유지한 채 빠르게 수정할 수 있습니다.",
    imageSources: ["/images/json_ex1.png"],
    imagePosition: "left center",
    imageScale: 1,
    imageTransformOrigin: "left center",
    imageAlt: "JSON 입력 자동 변환 미리보기",
    captureGuide: "Body 또는 Response에서 JSON 입력 모달로 스키마가 변환되는 화면",
    accent: "green",
  },
  {
    title: "예시 코드 실시간 동기화",
    description: "메서드와 파라미터를 수정하면 우측 예시 코드가 즉시 반영되어 문서 검수와 API 공유가 빨라집니다.",
    imageSources: ["/images/request_ex1.png"],
    imagePosition: "center top",
    imageScale: 1,
    imageTransformOrigin: "top center",
    imageAlt: "Request Response 동기화 미리보기",
    captureGuide: "좌측 파라미터 수정 시 우측 코드 예시가 즉시 바뀌는 화면",
    accent: "yellow",
  },
] as const;

const accentColorMap: Record<FeatureItem["accent"], { main: string; soft: string; deep: string }> = {
  blue: { main: "#006AB7", soft: "#E7F3FC", deep: "#16335C" },
  green: { main: "#00A9A4", soft: "#E7F9F8", deep: "#0D7B77" },
  yellow: { main: "#F3A941", soft: "#FFF4E5", deep: "#A86D11" },
};

export function DeveloperFeatureSection({ active }: DeveloperFeatureSectionProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cycleSeed, setCycleSeed] = useState(0);

  useEffect(() => {
    setProgress(0);
    const startedAt = performance.now();

    let frameId = 0;
    const animate = () => {
      const elapsed = performance.now() - startedAt;
      const ratio = Math.min(elapsed / FEATURE_CYCLE_MS, 1);
      setProgress(ratio * 100);

      if (ratio >= 1) {
        setOpenIndex((prev) => (prev + 1) % featureItems.length);
        return;
      }

      frameId = window.requestAnimationFrame(animate);
    };
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [openIndex, cycleSeed]);

  const activeItem = useMemo(() => {
    return featureItems[openIndex] ?? featureItems[0];
  }, [openIndex]);

  const activeAccent = accentColorMap[activeItem.accent];
  const activeImage = useMemo(() => {
    if (activeItem.imageSources.length === 0) {
      return null;
    }

    if (activeItem.imageSources.length === 1) {
      return activeItem.imageSources[0];
    }

    const elapsedMs = (progress / 100) * FEATURE_CYCLE_MS;
    const segmentMs = FEATURE_CYCLE_MS / activeItem.imageSources.length;
    const imageIndex = Math.min(
      Math.floor(elapsedMs / segmentMs),
      activeItem.imageSources.length - 1
    );

    return activeItem.imageSources[imageIndex] ?? null;
  }, [activeItem, progress]);

  const handleSelect = (index: number) => {
    if (index === openIndex) {
      setCycleSeed((prev) => prev + 1);
      return;
    }
    setOpenIndex(index);
    setCycleSeed((prev) => prev + 1);
  };

  return (
    <SectionFrame active={active}>
      <SectionInner>
        <LeftPane>
          <SectionTitle>API 문서 작성 시간을 단축해 드릴게요</SectionTitle>
          <AccordionList>
            {featureItems.map((item, index) => {
              const expanded = openIndex === index;
              const accent = accentColorMap[item.accent];
              return (
                <AccordionItemRow key={item.title}>
                  <AccordionTrigger
                    type="button"
                    onClick={() => handleSelect(index)}
                    aria-expanded={expanded}
                    aria-controls={`feature-accordion-panel-${index}`}
                  >
                    <AccordionTitle expanded={expanded} color={accent.main}>
                      {item.title}
                    </AccordionTitle>
                    <AccordionIcon expanded={expanded} color={accent.main} aria-hidden>
                      <ChevronDown size={20} strokeWidth={2.2} />
                    </AccordionIcon>
                  </AccordionTrigger>
                  <AccordionPanel
                    id={`feature-accordion-panel-${index}`}
                    expanded={expanded}
                    aria-hidden={!expanded}
                  >
                    <AccordionPanelInner expanded={expanded}>
                      <AccordionDescription>{item.description}</AccordionDescription>
                      <ProgressTrack>
                        <ProgressFill progress={expanded ? progress : 0} color={accent.main} />
                      </ProgressTrack>
                    </AccordionPanelInner>
                  </AccordionPanel>
                </AccordionItemRow>
              );
            })}
          </AccordionList>
        </LeftPane>

        <RightPane>
          <PreviewCardOuter main={activeAccent.main} deep={activeAccent.deep}>
            <PreviewAnimation key={`${openIndex}-${activeImage ?? "placeholder"}`}>
              {activeImage ? (
                <PreviewImage
                  src={activeImage}
                  alt={activeItem.imageAlt}
                  position={activeItem.imagePosition}
                  scale={activeItem.imageScale}
                  origin={activeItem.imageTransformOrigin}
                />
              ) : (
                <PreviewPlaceholder soft={activeAccent.soft}>
                  <PlaceholderBadge main={activeAccent.main} soft={activeAccent.soft}>BSDEV</PlaceholderBadge>
                  <PlaceholderTitle>{activeItem.title}</PlaceholderTitle>
                  <PlaceholderText>{activeItem.captureGuide}</PlaceholderText>
                </PreviewPlaceholder>
              )}
            </PreviewAnimation>
          </PreviewCardOuter>
        </RightPane>
      </SectionInner>
    </SectionFrame>
  );
}

const previewEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.992);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const SectionFrame = styled.div<{ active: boolean }>`
  width: 100%;
  min-height: calc(100vh - 74px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f5f7;
  opacity: ${({ active }) => (active ? 1 : 0.45)};
  transform: ${({ active }) => (active ? "translateY(0)" : "translateY(12px)")};
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  @media (max-width: 1023px) {
    min-height: auto;
  }
`;

const SectionInner = styled.div`
  width: min(1320px, calc(100% - 72px));
  margin: 0 auto;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 560px) minmax(0, 560px);
  column-gap: clamp(56px, 6vw, 104px);
  align-items: center;
  justify-content: center;

  @media (max-width: 1023px) {
    width: calc(100% - 40px);
    row-gap: 38px;
    padding: 58px 0;
    grid-template-columns: 1fr;
  }

  @media (max-width: 767px) {
    row-gap: 18px;
    padding: 42px 0;
  }
`;

const LeftPane = styled.div`
  width: 100%;
  max-width: 560px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 22px 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(28px, 3vw, 36px);
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  line-height: 1.24;

  @media (min-width: 1200px) {
    white-space: nowrap;
  }
`;

const AccordionList = styled.div`
  width: 100%;
  border-top: 0;
  border-bottom: 1px solid #d9e0ec;
`;

const AccordionItemRow = styled.div`
  border-top: 1px solid #d9e0ec;
  padding: 14px 0 12px 0;

  &:first-of-type {
    border-top: 0;
  }
`;

const AccordionTrigger = styled.button`
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const AccordionTitle = styled.span<{ expanded: boolean; color: string }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(20px, 2.2vw, 24px);
  font-weight: 700;
  color: ${({ expanded, color }) => (expanded ? color : "#5f697f")};
  transition: color 0.28s ease;
`;

const AccordionIcon = styled.span<{ expanded: boolean; color: string }>`
  color: ${({ expanded, color }) => (expanded ? color : "#7f8798")};
  transform: rotate(${({ expanded }) => (expanded ? "180deg" : "0deg")});
  transition: transform 0.28s ease, color 0.28s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const AccordionPanel = styled.div<{ expanded: boolean }>`
  display: grid;
  grid-template-rows: ${({ expanded }) => (expanded ? "1fr" : "0fr")};
  transition: grid-template-rows 0.42s cubic-bezier(0.22, 1, 0.36, 1);
`;

const AccordionPanelInner = styled.div<{ expanded: boolean }>`
  min-height: 0;
  overflow: hidden;
  opacity: ${({ expanded }) => (expanded ? 1 : 0)};
  transform: translateY(${({ expanded }) => (expanded ? "0px" : "-4px")});
  transition: opacity 0.28s ease, transform 0.36s ease;
`;

const AccordionDescription = styled.p`
  margin: 10px 0 12px 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: #556079;
  word-break: keep-all;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: #dce3ef;
  overflow: hidden;
`;

const ProgressFill = styled.span<{ color: string; progress: number }>`
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: ${({ color }) => color};
  transform-origin: left center;
  transform: scaleX(${({ progress }) => Math.max(0, Math.min(progress, 100)) / 100});
  transition: transform 0.06s linear;
  will-change: transform;
`;

const RightPane = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;

  @media (max-width: 1023px) {
    justify-content: center;
  }
`;

const PreviewCardOuter = styled.div<{ main: string; deep: string }>`
  width: min(560px, 100%);
  height: 420px;
  border-radius: 24px;
  background: linear-gradient(155deg, ${({ deep }) => deep} 0%, ${({ main }) => main} 100%);
  padding: 14px;
  box-shadow: 0 20px 42px rgba(19, 37, 72, 0.18);
  position: relative;
  overflow: hidden;

  @media (max-width: 1023px) {
    height: 360px;
  }
`;

const PreviewAnimation = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 18px;
  overflow: hidden;
  animation: ${previewEnter} 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  background: #edf1f7;
`;

const PreviewImage = styled.img<{ position: string; scale: number; origin: string }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: ${({ position }) => position};
  display: block;
  transform: scale(${({ scale }) => scale});
  transform-origin: ${({ origin }) => origin};
  transition: transform 0.36s ease;
`;

const PreviewPlaceholder = styled.div<{ soft: string }>`
  width: 100%;
  height: 100%;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  background: radial-gradient(circle at 18% 14%, #ffffff 0%, ${({ soft }) => soft} 60%);
`;

const PlaceholderBadge = styled.span<{ main: string; soft: string }>`
  width: fit-content;
  border-radius: 999px;
  background: ${({ soft }) => soft};
  color: ${({ main }) => main};
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
`;

const PlaceholderTitle = styled.h3`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(20px, 2.4vw, 26px);
  color: #111827;
  line-height: 1.3;
  letter-spacing: -0.02em;
`;

const PlaceholderText = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #4c5a74;
  word-break: keep-all;
`;
