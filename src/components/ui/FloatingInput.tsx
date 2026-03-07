"use client";

import { useState } from "react";
import styled from "@emotion/styled";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FloatingInput = ({ label, value, onChange, ...props }: FloatingInputProps) => {
  const [focused, setFocused] = useState(false);
  const inputValue = value?.toString() || "";
  const showFloatingLabel = focused || inputValue.length > 0;
  const inputPlaceholder = showFloatingLabel ? props.placeholder : undefined;

  return (
    <InputGroup>
      <Label active={showFloatingLabel}>{label}</Label>
      <Input
        {...props}
        value={inputValue}
        onChange={onChange}
        placeholder={inputPlaceholder}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </InputGroup>
  );
};

const InputGroup = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Label = styled.label<{ active: boolean }>`
  position: absolute;
  top: ${props => props.active ? '10px' : '18px'};
  left: 16px;
  font-size: ${props => props.active ? '12px' : '16px'};
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#16335C' : '#6B7280'};
  transition: all 0.2s ease;
  pointer-events: none;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const Input = styled.input`
  padding: 24px 16px 10px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  width: 100%;
  background: #F9FAFB;
  transition: all 0.2s ease;
  color: #1F2937;
  
  &:focus {
    outline: none;
    border-color: #16335C;
    background: #FFFFFF;
    box-shadow: 0 0 0 1px #16335C;
  }

  &:hover {
    background: #F3F4F6;
  }
`;
