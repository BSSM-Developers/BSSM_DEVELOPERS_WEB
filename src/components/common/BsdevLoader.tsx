"use client";

import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

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
  return (
    <Shell fullScreen={fullScreen} minHeight={minHeight} role="status" aria-live="polite" aria-label={label}>
      <Mark width={size} height={size} viewBox="0 0 143 144" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M143 72.5C143 86.6414 138.807 100.465 130.95 112.223C123.094 123.981 111.927 133.146 98.8619 138.557C85.797 143.969 71.4207 145.385 57.551 142.626C43.6814 139.867 30.9413 133.058 20.9419 123.058C10.9424 113.059 4.1327 100.319 1.37385 86.449C-1.38499 72.5793 0.0309478 58.2031 5.44261 45.1381C10.8543 32.0732 20.0186 20.9064 31.7767 13.0499C43.5348 5.1934 57.3586 1 71.5 1V72.5H143Z"
          fill="#737C97"
        />
        <Square className="sq1" x="59" y="112" width="22" height="22" />
        <Square className="sq2" x="59" y="94" width="22" height="22" />
        <Square className="sq3" x="59" y="76" width="22" height="22" />
        <Square className="sq4" x="40" y="76" width="22" height="22" />
        <Square className="sq5" x="59" y="58" width="22" height="22" />
        <Square className="sq6" x="78" y="39" width="22" height="22" />
        <Square className="sq7" x="97" y="20" width="22" height="22" />
        <Square className="sq8" x="116" y="1" width="22" height="22" />
        <Square className="sq9" x="116" y="39" width="22" height="22" />
      </Mark>
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

const blink = keyframes`
  0% {
    opacity: 0.3;
  }
  35% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
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

const Mark = styled.svg`
  animation: ${float} 1.3s ease-in-out infinite;

  .sq1 {
    animation: ${blink} 1.4s linear 0s infinite;
  }

  .sq2 {
    animation: ${blink} 1.4s linear 0.08s infinite;
  }

  .sq3 {
    animation: ${blink} 1.4s linear 0.16s infinite;
  }

  .sq4 {
    animation: ${blink} 1.4s linear 0.24s infinite;
  }

  .sq5 {
    animation: ${blink} 1.4s linear 0.32s infinite;
  }

  .sq6 {
    animation: ${blink} 1.4s linear 0.4s infinite;
  }

  .sq7 {
    animation: ${blink} 1.4s linear 0.48s infinite;
  }

  .sq8 {
    animation: ${blink} 1.4s linear 0.56s infinite;
  }

  .sq9 {
    animation: ${blink} 1.4s linear 0.64s infinite;
  }
`;

const Square = styled.rect`
  fill: #737c97;
  stroke: #ffffff;
  stroke-width: 3;
`;

const Label = styled.p`
  color: ${({ theme }) => theme.colors.grey[500]};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 500;
`;

