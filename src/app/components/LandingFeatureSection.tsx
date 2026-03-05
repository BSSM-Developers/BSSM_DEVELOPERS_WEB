"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";

interface LandingFeatureSectionProps {
  title: string;
  descriptionLines: readonly string[];
  buttonLabel: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  active: boolean;
}

export function LandingFeatureSection({
  title,
  descriptionLines,
  buttonLabel,
  href,
  imageSrc,
  imageAlt,
  active,
}: LandingFeatureSectionProps) {
  return (
    <Frame active={active}>
      <Inner>
        <TextArea>
          <Title>{title}</Title>
          <Description>
            {descriptionLines.map((line) => (
              <DescriptionLine key={line}>{line}</DescriptionLine>
            ))}
          </Description>
          <ActionLink href={href}>{buttonLabel}</ActionLink>
        </TextArea>
        <VisualArea>
          <PreviewImage src={imageSrc} alt={imageAlt} width={780} height={500} />
        </VisualArea>
      </Inner>
    </Frame>
  );
}

const Frame = styled.div<{ active: boolean }>`
  width: 100%;
  overflow-x: clip;
  opacity: ${({ active }) => (active ? 1 : 0.42)};
  transform: ${({ active }) => (active ? "translateY(0)" : "translateY(24px)")};
  transition: opacity 0.45s ease, transform 0.45s ease;
`;

const Inner = styled.div`
  width: min(1120px, calc(100% - 72px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 52px;
  align-items: center;
  padding-top: 36px;

  @media (max-width: 980px) {
    width: calc(100% - 40px);
    grid-template-columns: 1fr;
    gap: 24px;
    padding-top: 0;
  }
`;

const TextArea = styled.div`
  max-width: 400px;
  transform: translateX(-44px);

  @media (max-width: 980px) {
    transform: translateX(0);
  }
`;

const Title = styled.h2`
  color: #101828;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(28px, 3.4vw, 42px);
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.02em;
`;

const Description = styled.div`
  margin-top: 14px;
`;

const DescriptionLine = styled.p`
  color: #6c758b;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: clamp(14px, 1.5vw, 20px);
  line-height: 1.5;
`;

const ActionLink = styled(Link)`
  margin-top: 28px;
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

const VisualArea = styled.div`
  width: calc(100% + max(0px, (100vw - 1120px) / 2) + 52px);
  margin-right: calc(max(0px, (100vw - 1120px) / -2) - 52px);
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 980px) {
    width: 100%;
    margin-right: 0;
    min-height: auto;
    justify-content: center;
  }
`;

const PreviewImage = styled(Image)`
  width: min(100%, 760px);
  height: auto;
  object-fit: contain;
  transform: translateX(62px);

  @media (max-width: 980px) {
    transform: translateX(0);
  }
`;
