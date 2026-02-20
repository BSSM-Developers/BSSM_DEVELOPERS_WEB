"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";


type ParamItemProps = {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  className?: string;
  editable?: boolean;
  onChange?: (updated: { name: string; type: string; description: string; required: boolean }) => void;
  onDelete?: () => void;
};

export function ParamItem({
  name,
  type,
  description,
  required = false,
  className,
  editable = false,
  onChange,
  onDelete
}: ParamItemProps) {
  if (editable) {
    return (
      <Container className={className} style={{ padding: '8px 0' }}>
        <ParamInfo style={{ gap: '4px' }}>
          <ParamHeader>
            <EditInput
              value={name}
              onChange={(e) => onChange?.({ name: e.target.value, type, description, required })}
              placeholder="이름"
              style={{ width: '100px', color: '#58A6FF', fontWeight: 500 }}
            />
            <TypeSelect
              value={type}
              onChange={(newType) => onChange?.({ name, type: newType, description, required })}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#F06820', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => onChange?.({ name, type, description, required: e.target.checked })}
              />
              필수
            </label>
          </ParamHeader>
          <DescriptionWrapper>
            <EditInput
              value={description}
              onChange={(e) => onChange?.({ name, type, description: e.target.value, required })}
              placeholder="설명"
              style={{ flex: 1 }}
            />
          </DescriptionWrapper>
        </ParamInfo>
        <DeleteButton type="button" onClick={onDelete}>×</DeleteButton>
      </Container>
    );
  }

  return (
    <Container className={className}>
      <ParamInfo>
        <ParamHeader>
          <NameTag>{name}</NameTag>
          <TypeText>{type}</TypeText>
        </ParamHeader>
        <DescriptionWrapper>
          <Description>{description}</Description>
        </DescriptionWrapper>
      </ParamInfo>
      {required && <RequiredText>required</RequiredText>}
    </Container>
  );
}

const PARAM_TYPES = ["string", "number", "boolean", "object", "array", "any"];

function TypeSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });

      const handleClickOutside = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <SelectContainer ref={triggerRef}>
      <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
        {value || "타입"}
        <Arrow isOpen={isOpen}>▼</Arrow>
      </SelectTrigger>
      {isOpen && createPortal(
        <>
          <SelectOptions style={{
            top: coords.top + 4,
            left: coords.left,
            width: coords.width,
            position: 'absolute'
          }}>
            {PARAM_TYPES.map((t) => (
              <SelectOption
                key={t}
                active={value === t}
                onClick={() => {
                  onChange(t);
                  setIsOpen(false);
                }}
              >
                {t}
              </SelectOption>
            ))}
          </SelectOptions>
        </>,
        document.body
      )}
    </SelectContainer>
  );
}

const SelectContainer = styled.div`
  position: relative;
  width: 100px;
`;

const SelectTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #4B5563;
  cursor: pointer;
  &:hover {
    border-color: #58A6FF;
  }
`;

const Arrow = styled.span<{ isOpen: boolean }>`
  font-size: 10px;
  transition: transform 0.2s ease;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0)")};
  color: #9CA3AF;
`;

const SelectOptions = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  overflow: hidden;
`;

const SelectOption = styled.div<{ active: boolean }>`
  padding: 6px 10px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: ${({ active }) => (active ? "#58A6FF" : "#4B5563")};
  background: ${({ active }) => (active ? "#F7FBFF" : "transparent")};
  cursor: pointer;
  &:hover {
    background: #F3F4F6;
  }
`;

const SelectBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
`;

const EditInput = styled.input`
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 4px 8px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  outline: none;
  background: white;
  color: #191F28;
  &:focus {
    border-color: #58A6FF;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #FF4D4F;
  font-size: 20px;
  cursor: pointer;
  padding: 0 8px;
  &:hover {
    color: #CF1322;
  }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 0;
  width: 100%;
  max-width: 850px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 0;
  }
`;

const ParamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ParamHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const NameTag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  min-width: 72px;
  height: 24px;
  border-radius: 3px;
  background: #F7FBFF;
  color: #58A6FF;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 12px;
  text-align: center;
  letter-spacing: -0.6px;
  white-space: nowrap;

  @media (max-width: 768px) {
    min-width: 60px;
    font-size: 11px;
  }
`;

const TypeText = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  background: #F3F4F6;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #6B7280;
  letter-spacing: -0.3px;
  white-space: nowrap;
`;

const DescriptionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 0 0 3px;
  width: 100%;
`;

const Description = styled.div`
  flex: 1;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #8B95A1;
  letter-spacing: -0.7px;
`;

const RequiredText = styled.span`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #F06820;
  text-align: center;
  letter-spacing: -0.6px;
  white-space: pre;
`;