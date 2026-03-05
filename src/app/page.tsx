"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LandingFeatureSection } from "./components/LandingFeatureSection";

const landingFeatures = [
  {
    id: "feature-1",
    titleLines: ["쉬운 문서 작성으로", "문서를 작성해보세요"],
    descriptionLines: [
      "BSSM Developers만의 블록형 문서 에디터를 활용하면",
      "보다 쉽게 문서를 완성할 수 있어요",
    ],
    buttonLabel: "API 등록하러 가기",
    href: "/docs/register",
    imageSrc: "/images/main_ex1.png",
    imageAlt: "문서 작성 예시",
  },
  {
    id: "feature-2",
    titleLines: ["깔끔한 API 문서 작성", "UI가 준비 되어있어요"],
    descriptionLines: [
      "API 문서를 작성할 때 불편하지 않도록",
      "최대한 편안한 UI를 제공할 수 있도록 노력했어요",
    ],
    buttonLabel: "API 등록하러 가기",
    href: "/docs/register",
    imageSrc: "/images/main_ex2.png",
    imageAlt: "API 문서 UI 예시",
  },
  {
    id: "feature-3",
    titleLines: ["토큰으로 사용중인 API를", "관리해요"],
    descriptionLines: [
      "BSSM Developers는 토큰을 발급 받아 원하는 API의",
      "사용 권한을 토큰에 부여 받아서 사용할 수 있어요",
    ],
    buttonLabel: "API 사용하러 가기",
    href: "/apis",
    imageSrc: "/images/main_ex3.png",
    imageAlt: "토큰 관리 예시",
  },
] as const;

export default function Home() {
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const index = Number(visible.target.getAttribute("data-index"));
        if (Number.isNaN(index)) {
          return;
        }

        setActiveIndex(index);
      },
      {
        threshold: [0.45, 0.6, 0.75],
      }
    );

    sectionRefs.current.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Page>
      <SnapSection
        data-index={0}
        ref={(element) => {
          sectionRefs.current[0] = element;
        }}
      >
        <HeroSection active={activeIndex === 0}>
          <HeroIcon>
            <HeroSymbol
              width="143"
              height="144"
              viewBox="0 0 143 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M143 72.5C143 86.6414 138.807 100.465 130.95 112.223C123.094 123.981 111.927 133.146 98.8619 138.557C85.797 143.969 71.4207 145.385 57.551 142.626C43.6814 139.867 30.9413 133.058 20.9419 123.058C10.9424 113.059 4.1327 100.319 1.37385 86.449C-1.38499 72.5793 0.0309478 58.2031 5.44261 45.1381C10.8543 32.0732 20.0186 20.9064 31.7767 13.0499C43.5348 5.1934 57.3586 1 71.5 1V72.5H143Z"
                fill="#737C97"
              />
              <g filter="url(#filter0_f_122_708)">
                <rect x="59" y="112" width="22" height="22" fill="#737C97" />
                <rect x="60.5" y="113.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter1_f_122_708)">
                <rect x="59" y="94" width="22" height="22" fill="#737C97" />
                <rect x="60.5" y="95.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter2_f_122_708)">
                <rect x="59" y="76" width="22" height="22" fill="#737C97" />
                <rect x="60.5" y="77.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter3_f_122_708)">
                <rect x="40" y="76" width="22" height="22" fill="#737C97" />
                <rect x="41.5" y="77.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter4_f_122_708)">
                <rect x="59" y="58" width="22" height="22" fill="#737C97" />
                <rect x="60.5" y="59.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter5_f_122_708)">
                <rect x="78" y="39" width="22" height="22" fill="#737C97" />
                <rect x="79.5" y="40.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter6_f_122_708)">
                <rect x="97" y="20" width="22" height="22" fill="#737C97" />
                <rect x="98.5" y="21.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter7_f_122_708)">
                <rect x="116" y="1" width="22" height="22" fill="#737C97" />
                <rect x="117.5" y="2.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <g filter="url(#filter8_f_122_708)">
                <rect x="116" y="39" width="22" height="22" fill="#737C97" />
                <rect x="117.5" y="40.5" width="19" height="19" stroke="white" strokeWidth="3" />
              </g>
              <defs>
                <filter
                  id="filter0_f_122_708"
                  x="58"
                  y="111"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter1_f_122_708"
                  x="58"
                  y="93"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter2_f_122_708"
                  x="58"
                  y="75"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter3_f_122_708"
                  x="39"
                  y="75"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter4_f_122_708"
                  x="58"
                  y="57"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter5_f_122_708"
                  x="77"
                  y="38"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter6_f_122_708"
                  x="96"
                  y="19"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter7_f_122_708"
                  x="115"
                  y="0"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
                <filter
                  id="filter8_f_122_708"
                  x="115"
                  y="38"
                  width="24"
                  height="24"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_122_708" />
                </filter>
              </defs>
            </HeroSymbol>
          </HeroIcon>
          <HeroTitle>“빨리 가려면 혼자 가고, 멀리 가려면 함께 가라”</HeroTitle>
          <HeroDescription>
            BSSM Developers는 한 번 사용하고 버려지기 아까운 API들을 교내에 공유하여
            <br />
            다른 학생들이 API를 편하게 사용하기 위해 시작되었습니다.
          </HeroDescription>
          <HeroButton href="/apis">사용하러 가기</HeroButton>
        </HeroSection>
      </SnapSection>

      {landingFeatures.map((feature, index) => (
        <SnapSection
          key={feature.id}
          data-index={index + 1}
          ref={(element) => {
            sectionRefs.current[index + 1] = element;
          }}
        >
          <LandingFeatureSection
            titleLines={feature.titleLines}
            descriptionLines={feature.descriptionLines}
            buttonLabel={feature.buttonLabel}
            href={feature.href}
            imageSrc={feature.imageSrc}
            imageAlt={feature.imageAlt}
            active={activeIndex === index + 1}
          />
        </SnapSection>
      ))}
    </Page>
  );
}

const Page = styled.main`
  width: 100%;
  height: calc(100dvh - 72px);
  background: #f4f5f7;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
`;

const SnapSection = styled.section`
  min-height: calc(100dvh - 72px);
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  align-items: center;
`;

const HeroSection = styled.div<{ active: boolean }>`
  width: min(1120px, calc(100% - 72px));
  margin: 0 auto;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transform: ${({ active }) => (active ? "translateY(0)" : "translateY(26px)")};
  opacity: ${({ active }) => (active ? 1 : 0.44)};
  transition: opacity 0.45s ease, transform 0.45s ease;

  @media (max-width: 900px) {
    width: calc(100% - 40px);
    padding-top: 0;
  }
`;

const HeroIcon = styled.div`
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeroSymbol = styled.svg`
  width: 92px;
  height: 92px;
`;

const HeroTitle = styled.h1`
  margin-top: 36px;
  color: #111827;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  line-height: 1.24;
  letter-spacing: -0.02em;
`;

const HeroDescription = styled.p`
  margin-top: 14px;
  color: #616b81;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(14px, 1.6vw, 20px);
  line-height: 1.48;
`;

const PrimaryLink = styled(Link)`
  min-width: 168px;
  height: 46px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  font-weight: 700;
  transition: filter 0.2s ease, transform 0.2s ease;

  &:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
  }
`;

const HeroButton = styled(PrimaryLink)`
  margin-top: 36px;
`;
