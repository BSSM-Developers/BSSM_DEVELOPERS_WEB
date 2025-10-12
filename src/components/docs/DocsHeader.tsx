"use client";

import styled from "@emotion/styled";

interface DocsHeaderProps {
  title: string;
  breadcrumb?: string[];
}

export function DocsHeader({ title, breadcrumb = [] }: DocsHeaderProps) {
  return (
    <Header>
      <BreadcrumbAndTitle>
        {breadcrumb.length > 0 && (
          <Breadcrumb>
            {breadcrumb.join(" / ")}
          </Breadcrumb>
        )}
        <Title>{' / ' + title}</Title>
      </BreadcrumbAndTitle>
    </Header>
  );
}

const Header = styled.header`
  margin-bottom: 48px;
`;

const BreadcrumbAndTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Breadcrumb = styled.span`
  ${({ theme }) => theme.typography.Body_1};
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const Title = styled.span`
  ${({ theme }) => theme.typography.Body_3};
  color: ${({ theme }) => theme.colors.grey[700]};
`;
