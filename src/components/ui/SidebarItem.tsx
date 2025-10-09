"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function SidebarItem({
  label,
  nestedItems,
}: {
  label: string;
  nestedItems?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Wrapper>
      <Item onClick={() => nestedItems && setOpen(!open)}>
        {nestedItems && (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        {label}
      </Item>
      {open && nestedItems && (
        <SubList>
          {nestedItems.map((item) => (
            <SubItem key={item}>{item}</SubItem>
          ))}
        </SubList>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.grey[200]};
  }
`;

const SubList = styled.div`
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SubItem = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.grey[700]};
  cursor: pointer;
  padding: 4px 0;

  &:hover {
    color: ${({ theme }) => theme.colors.bssmBlue};
  }
`;
