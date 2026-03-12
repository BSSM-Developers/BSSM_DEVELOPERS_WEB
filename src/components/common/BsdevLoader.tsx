"use client";

import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { useId } from "react";

interface BsdevLoaderProps {
  label?: string;
  size?: number;
  fullScreen?: boolean;
  minHeight?: string;
}

export function BsdevLoader({
  label = "불러오는 중...",
  size = 72,
  fullScreen = false,
  minHeight = "180px",
}: BsdevLoaderProps) {
  const filterIdPrefix = useId().replace(/:/g, "_");
  const iconHeight = Math.max(56, size);
  const iconWidth = Math.round((iconHeight * 143) / 144);

  return (
    <Shell fullScreen={fullScreen} minHeight={minHeight} role="status" aria-live="polite" aria-label={label}>
      <LogoMotion>
        <LoaderSvg width={iconWidth} height={iconHeight} viewBox="0 0 143 144" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M143 72.5C143 86.6414 138.807 100.465 130.95 112.223C123.094 123.981 111.927 133.146 98.8619 138.557C85.797 143.969 71.4207 145.385 57.5511 142.626C43.6815 139.867 30.9414 133.058 20.9419 123.058C10.9425 113.059 4.13276 100.319 1.37391 86.449C-1.38493 72.5793 0.0310088 58.2031 5.44267 45.1381C10.8543 32.0732 20.0187 20.9064 31.7768 13.0499C43.5349 5.1934 57.3587 1 71.5001 1V72.5H143Z" fill="#737C97" />
          <g className="sq1" filter={`url(#${filterIdPrefix}_f0)`}>
            <rect x="59.0001" y="112" width="22" height="22" fill="#737C97" />
            <rect x="60.5001" y="113.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq2" filter={`url(#${filterIdPrefix}_f1)`}>
            <rect x="59.0001" y="94" width="22" height="22" fill="#737C97" />
            <rect x="60.5001" y="95.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq3" filter={`url(#${filterIdPrefix}_f2)`}>
            <rect x="59.0001" y="76" width="22" height="22" fill="#737C97" />
            <rect x="60.5001" y="77.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq4" filter={`url(#${filterIdPrefix}_f3)`}>
            <rect x="40.0001" y="76" width="22" height="22" fill="#737C97" />
            <rect x="41.5001" y="77.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq5" filter={`url(#${filterIdPrefix}_f4)`}>
            <rect x="59.0001" y="58" width="22" height="22" fill="#737C97" />
            <rect x="60.5001" y="59.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq6" filter={`url(#${filterIdPrefix}_f5)`}>
            <rect x="78.0001" y="39" width="22" height="22" fill="#737C97" />
            <rect x="79.5001" y="40.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq7" filter={`url(#${filterIdPrefix}_f6)`}>
            <rect x="97.0001" y="20" width="22" height="22" fill="#737C97" />
            <rect x="98.5001" y="21.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq8" filter={`url(#${filterIdPrefix}_f7)`}>
            <rect x="116" y="1" width="22" height="22" fill="#737C97" />
            <rect x="117.5" y="2.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <g className="sq9" filter={`url(#${filterIdPrefix}_f8)`}>
            <rect x="116" y="39" width="22" height="22" fill="#737C97" />
            <rect x="117.5" y="40.5" width="19" height="19" stroke="white" strokeWidth="3" />
          </g>
          <defs>
            <filter id={`${filterIdPrefix}_f0`} x="58.0001" y="111" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f1`} x="58.0001" y="93" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f2`} x="58.0001" y="75" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f3`} x="39.0001" y="75" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f4`} x="58.0001" y="57" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f5`} x="77.0001" y="38" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f6`} x="96.0001" y="19" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f7`} x="115" y="0" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
            <filter id={`${filterIdPrefix}_f8`} x="115" y="38" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur_85_150" />
            </filter>
          </defs>
        </LoaderSvg>
      </LogoMotion>
      <Label>{label}</Label>
    </Shell>
  );
}

const float = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
  100% {
    transform: translateY(0);
  }
`;

const glow = keyframes`
  0% {
    opacity: 0.84;
    filter: drop-shadow(0 0 0 rgba(22, 51, 92, 0.05));
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 8px 18px rgba(22, 51, 92, 0.2));
  }
  100% {
    opacity: 0.84;
    filter: drop-shadow(0 0 0 rgba(22, 51, 92, 0.05));
  }
`;

const blink = keyframes`
  0% {
    opacity: 0.38;
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0.38;
  }
`;

const Shell = styled.div<{ fullScreen: boolean; minHeight: string }>`
  width: 100%;
  min-height: ${({ fullScreen, minHeight }) => (fullScreen ? "calc(100dvh - 72px)" : minHeight)};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
`;

const LogoMotion = styled.div`
  display: inline-flex;
  animation:
    ${float} 1.3s ease-in-out infinite,
    ${glow} 1.6s ease-in-out infinite;
`;

const LoaderSvg = styled.svg`
  display: block;
  .sq1 {
    animation: ${blink} 1.4s ease-in-out infinite 0.05s;
  }
  .sq2 {
    animation: ${blink} 1.4s ease-in-out infinite 0.12s;
  }
  .sq3 {
    animation: ${blink} 1.4s ease-in-out infinite 0.19s;
  }
  .sq4 {
    animation: ${blink} 1.4s ease-in-out infinite 0.26s;
  }
  .sq5 {
    animation: ${blink} 1.4s ease-in-out infinite 0.33s;
  }
  .sq6 {
    animation: ${blink} 1.4s ease-in-out infinite 0.4s;
  }
  .sq7 {
    animation: ${blink} 1.4s ease-in-out infinite 0.47s;
  }
  .sq8 {
    animation: ${blink} 1.4s ease-in-out infinite 0.54s;
  }
  .sq9 {
    animation: ${blink} 1.4s ease-in-out infinite 0.61s;
  }
`;

const Label = styled.p`
  color: ${({ theme }) => theme.colors.grey[500]};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 500;
`;
