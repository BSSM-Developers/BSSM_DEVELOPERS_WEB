"use client";

import styled from "@emotion/styled";

interface DocsSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function DocsSection({ title, children }: DocsSectionProps) {
  return (
    <Section>
      {title && <Heading>{title}</Heading>}
      <Body>{children}</Body>
    </Section>
  );
}

const Section = styled.section`
  margin-bottom: 64px;
`;

const Heading = styled.div`
  ${({ theme }) => theme.typography.Headline_1}
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 16px;
`;

const Body = styled.div`
${({ theme }) => theme.typography.Docs_1}
  color: ${({ theme }) => theme.colors.grey[600]};
  line-height: 1.7;
`;
