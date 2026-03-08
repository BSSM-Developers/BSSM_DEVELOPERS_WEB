"use client";

import {
  HeroButton,
  HeroDescription,
  HeroIcon,
  HeroSection,
  HeroSymbol,
  HeroTitle,
} from "./HomePage.styles";

interface HomeHeroSectionProps {
  active: boolean;
}

export function HomeHeroSection({ active }: HomeHeroSectionProps) {
  return (
    <HeroSection active={active}>
      <HeroIcon>
        <HeroSymbol width="143" height="144" viewBox="0 0 143 144" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M143 72.5C143 86.6414 138.807 100.465 130.95 112.223C123.094 123.981 111.927 133.146 98.8619 138.557C85.797 143.969 71.4207 145.385 57.551 142.626C43.6814 139.867 30.9413 133.058 20.9419 123.058C10.9424 113.059 4.1327 100.319 1.37385 86.449C-1.38499 72.5793 0.0309478 58.2031 5.44261 45.1381C10.8543 32.0732 20.0186 20.9064 31.7767 13.0499C43.5348 5.1934 57.3586 1 71.5 1V72.5H143Z"
            fill="#737C97"
          />
          <g filter="url(#filter0_f_122_708)">
            <rect className="sq1" x="59" y="112" width="22" height="22" fill="#737C97" />
            <rect x="60.5" y="113.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter1_f_122_708)">
            <rect className="sq2" x="59" y="94" width="22" height="22" fill="#737C97" />
            <rect x="60.5" y="95.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter2_f_122_708)">
            <rect className="sq3" x="59" y="76" width="22" height="22" fill="#737C97" />
            <rect x="60.5" y="77.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter3_f_122_708)">
            <rect className="sq4" x="40" y="76" width="22" height="22" fill="#737C97" />
            <rect x="41.5" y="77.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter4_f_122_708)">
            <rect className="sq5" x="59" y="58" width="22" height="22" fill="#737C97" />
            <rect x="60.5" y="59.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter5_f_122_708)">
            <rect className="sq6" x="78" y="39" width="22" height="22" fill="#737C97" />
            <rect x="79.5" y="40.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter6_f_122_708)">
            <rect className="sq7" x="97" y="20" width="22" height="22" fill="#737C97" />
            <rect x="98.5" y="21.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter7_f_122_708)">
            <rect className="sq8" x="116" y="1" width="22" height="22" fill="#737C97" />
            <rect x="117.5" y="2.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g filter="url(#filter8_f_122_708)">
            <rect className="sq9" x="116" y="39" width="22" height="22" fill="#737C97" />
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
  );
}
