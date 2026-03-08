"use client";

import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import Link from "next/link";

export const Page = styled.main`
  width: 100%;
  height: calc(100dvh - 72px);
  background: #f4f5f7;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
`;

export const SnapSection = styled.section`
  min-height: calc(100dvh - 72px);
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  align-items: center;
`;

export const HeroSection = styled.div<{ active: boolean }>`
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

const heroEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const iconGlow = keyframes`
  0% {
    filter: drop-shadow(0 0 0 rgba(22, 51, 92, 0.04));
  }
  50% {
    filter: drop-shadow(0 8px 22px rgba(22, 51, 92, 0.18));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(22, 51, 92, 0.04));
  }
`;

const loaderBlink = keyframes`
  0% {
    opacity: 0.26;
  }
  35% {
    opacity: 1;
  }
  100% {
    opacity: 0.26;
  }
`;

export const HeroIcon = styled.div`
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: ${heroEnter} 0.62s cubic-bezier(0.2, 0.72, 0.2, 1) forwards;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`;

export const HeroSymbol = styled.svg`
  width: 92px;
  height: 92px;
  animation: ${iconGlow} 3.2s ease-in-out 0.62s infinite;

  .sq1 {
    animation: ${loaderBlink} 3.2s linear 0.62s infinite;
  }

  .sq2 {
    animation: ${loaderBlink} 3.2s linear 0.74s infinite;
  }

  .sq3 {
    animation: ${loaderBlink} 3.2s linear 0.86s infinite;
  }

  .sq4 {
    animation: ${loaderBlink} 3.2s linear 0.98s infinite;
  }

  .sq5 {
    animation: ${loaderBlink} 3.2s linear 1.1s infinite;
  }

  .sq6 {
    animation: ${loaderBlink} 3.2s linear 1.22s infinite;
  }

  .sq7 {
    animation: ${loaderBlink} 3.2s linear 1.34s infinite;
  }

  .sq8 {
    animation: ${loaderBlink} 3.2s linear 1.46s infinite;
  }

  .sq9 {
    animation: ${loaderBlink} 3.2s linear 1.58s infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    .sq1,
    .sq2,
    .sq3,
    .sq4,
    .sq5,
    .sq6,
    .sq7,
    .sq8,
    .sq9 {
      animation: none;
      opacity: 1;
    }
  }
`;

export const HeroTitle = styled.h1`
  margin-top: 36px;
  color: #111827;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  line-height: 1.24;
  letter-spacing: -0.02em;
  opacity: 0;
  animation: ${heroEnter} 0.62s cubic-bezier(0.2, 0.72, 0.2, 1) 0.12s forwards;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`;

export const HeroDescription = styled.p`
  margin-top: 14px;
  color: #616b81;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(14px, 1.6vw, 20px);
  line-height: 1.48;
  opacity: 0;
  animation: ${heroEnter} 0.62s cubic-bezier(0.2, 0.72, 0.2, 1) 0.22s forwards;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
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

export const HeroButton = styled(PrimaryLink)`
  margin-top: 36px;
  opacity: 0;
  animation: ${heroEnter} 0.62s cubic-bezier(0.2, 0.72, 0.2, 1) 0.3s forwards;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`;
