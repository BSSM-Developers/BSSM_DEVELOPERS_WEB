"use client";

import styled from "@emotion/styled";

interface ApiBreadcrumbProps {
  category?: string;
  subcategory?: string;
}

export function ApiBreadcrumb({ category = "API", subcategory }: ApiBreadcrumbProps) {
  return (
    <BreadcrumbSection>
      <Breadcrumb>
        <BreadcrumbItem disabled>{category} /</BreadcrumbItem>
        {subcategory && <BreadcrumbItem active>{subcategory}</BreadcrumbItem>}
      </Breadcrumb>
    </BreadcrumbSection>
  );
}

const BreadcrumbSection = styled.div`
  width: 100%;
`;

const Breadcrumb = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  line-height: 1;
  letter-spacing: -0.8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BreadcrumbItem = styled.span<{ disabled?: boolean; active?: boolean }>`
  color: ${({ disabled, active }) =>
    disabled ? "#B0B8C1" : active ? "#4E5968" : "#000000"};
  font-weight: ${({ active }) => active ? 500 : 400};
`;