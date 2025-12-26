"use client";

import styled from "@emotion/styled";
import { ApiCard } from "./ApiCard";
import type { ApiItem } from "@/app/apis/mockData";

interface ApiSectionProps {
  title: string;
  description: string;
  items: ApiItem[];
}

export function ApiSection({ title, description, items }: ApiSectionProps) {
  return (
    <SectionContainer>
      <Header>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Header>
      <Grid>
        {items.map((item) => (
          <ApiCard
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            tags={item.tags}
            logo={item.logo}
          />
        ))}
      </Grid>
    </SectionContainer>
  );
}

const SectionContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 60px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h2`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #191F28;
  margin: 0;
  letter-spacing: -0.6px;
  text-transform: uppercase;
`;

const Description = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #8B95A1;
  margin: 0;
  letter-spacing: -0.35px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
