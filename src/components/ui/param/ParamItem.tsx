"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import type { ApiParam } from "@/types/docs";

const HEADER_OPTIONS = [
  "Accept", "Accept-Encoding", "Accept-Language", "Authorization", "Cache-Control",
  "Content-Type", "Content-Length", "Cookie", "Connection", "Host", "Origin",
  "Referer", "User-Agent", "X-Requested-With", "X-Forwarded-For", "X-CSRF-Token"
];

const COOKIE_OPTIONS = [
  "session_id", "access_token", "refresh_token", "JSESSIONID", "csrftoken", "AWSELB"
];

type ParamItemProps = {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  example?: string;
  childrenProps?: ApiParam[];
  className?: string;
  editable?: boolean;
  paramLocation?: 'header' | 'cookie' | 'query' | 'path' | 'body';
  hideRequired?: boolean;
  onChange?: (updated: { name: string; type: string; description: string; required: boolean; example?: string; children?: ApiParam[] }) => void;
  onDelete?: () => void;
};

export function ParamItem({
  name,
  type,
  description,
  required = false,
  example = "",
  childrenProps = [],
  className,
  editable = false,
  paramLocation = 'body',
  hideRequired = false,
  onChange,
  onDelete
}: ParamItemProps) {
  const isComplexType = type === 'object' || type === 'array';

  const allowedTypes = (() => {
    switch (paramLocation) {
      case 'header':
      case 'cookie':
      case 'path':
        return ["string", "integer", "boolean", "number"];
      case 'query':
        return ["string", "integer", "boolean", "number", "array"];
      default:
        return ["string", "integer", "boolean", "number", "array", "object", "null", "any", "file"];
    }
  })();

  if (editable) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Container className={className} style={{ padding: '8px 0' }}>
          <ParamInfo style={{ gap: '4px' }}>
            <ParamHeader>
              {paramLocation === 'header' || paramLocation === 'cookie' ? (
                <NameCombobox
                  value={name}
                  options={paramLocation === 'header' ? HEADER_OPTIONS : COOKIE_OPTIONS}
                  onChange={(val) => onChange?.({ name: val, type, description, required, example, children: childrenProps })}
                  placeholder="이름"
                />
              ) : (
                <EditInput
                  value={name}
                  onChange={(e) => onChange?.({ name: e.target.value, type, description, required, example, children: childrenProps })}
                  placeholder="이름"
                  style={{ width: '100px', color: '#58A6FF', fontWeight: 500 }}
                />
              )}
              <TypeSelect
                value={type}
                options={allowedTypes}
                onChange={(newType) => {
                  let newExample = example;
                  if (newType === 'null') newExample = 'null';
                  onChange?.({ name, type: newType, description, required, example: newExample, children: childrenProps });
                }}
              />
              {!hideRequired ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#F06820', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => onChange?.({ name, type, description, required: e.target.checked, example, children: childrenProps })}
                  />
                  필수
                </label>
              ) : null}
            </ParamHeader>
            <DescriptionWrapper style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <EditInput
                value={description}
                onChange={(e) => onChange?.({ name, type, description: e.target.value, required, example, children: childrenProps })}
                placeholder="설명"
                style={{ flex: 1, minWidth: '150px' }}
              />
              {!isComplexType && type !== 'null' && type !== 'file' && (
                <EditInput
                  value={example}
                  onChange={(e) => {
                    const val = e.target.value;
                    let inferredType = type;
                    if (val === "true" || val === "false") {
                      inferredType = "boolean";
                    } else if (!isNaN(Number(val)) && val.trim() !== '') {
                      inferredType = val.includes(".") ? "number" : "integer";
                    } else if (val.startsWith("[") && val.endsWith("]")) {
                      inferredType = "array";
                    } else if (val === "null") {
                      inferredType = "null";
                    } else if (val.startsWith("{") && val.endsWith("}")) {
                      inferredType = "object";
                    } else if (val.length > 0) {
                      inferredType = "string";
                    }
                    onChange?.({ name, type: inferredType, description, required, example: val, children: childrenProps });
                  }}
                  placeholder="예시 값"
                  style={{ flex: 1, minWidth: '150px' }}
                />
              )}
              {!isComplexType && type === 'file' && (
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onChange?.({ name, type, description, required, example: `file:///${file.name}`, children: childrenProps });
                    }
                  }}
                  style={{ flex: 1, minWidth: '150px', fontSize: '12px' }}
                />
              )}
            </DescriptionWrapper>
          </ParamInfo>
          <DeleteButton type="button" onClick={onDelete}>×</DeleteButton>
        </Container>
        {isComplexType && (
          <ChildrenContainer>
            {childrenProps.map((child, index) => (
              <ParamItem
                key={index}
                name={child.name}
                type={child.type}
                description={child.description}
                required={child.required}
                example={child.example}
                childrenProps={child.children}
                paramLocation={paramLocation}
                editable={true}
                hideRequired={hideRequired}
                onChange={(updated) => {
                  const nextChildren = [...childrenProps];
                  nextChildren[index] = updated;
                  onChange?.({ name, type, description, required, example, children: nextChildren });
                }}
                onDelete={() => {
                  const nextChildren = childrenProps.filter((_, i) => i !== index);
                  onChange?.({ name, type, description, required, example, children: nextChildren });
                }}
              />
            ))}
            <AddChildButton type="button" onClick={() => {
              const nextChildren = [...childrenProps, { name: "", type: "string", description: "", required: false, example: "" }];
              onChange?.({ name, type, description, required, example, children: nextChildren });
            }}>
              + 하위 속성 추가
            </AddChildButton>
          </ChildrenContainer>
        )}
      </div>
    );
  }

  return (
    <>
      <Container className={className}>
        <ParamInfo>
          <ParamHeader>
            <NameTag>{name}</NameTag>
            <TypeText>{type}</TypeText>
          </ParamHeader>
          <DescriptionWrapper>
            <Description>{description}</Description>
            {example && !isComplexType && <ExampleText>{example}</ExampleText>}
          </DescriptionWrapper>
        </ParamInfo>
        {!hideRequired && required ? (
          <RequiredText style={{ marginLeft: '12px' }}>required</RequiredText>
        ) : null}
      </Container>
      {isComplexType && childrenProps.length > 0 && (
        <ChildrenContainer>
          {childrenProps.map((child, index) => (
            <ParamItem
              key={index}
              name={child.name}
              type={child.type}
              description={child.description}
              required={child.required}
              example={child.example}
              childrenProps={child.children}
              paramLocation={paramLocation}
              editable={false}
              hideRequired={hideRequired}
            />
          ))}
        </ChildrenContainer>
      )}
    </>
  );
}

function NameCombobox({ value, options, onChange, placeholder }: { value: string; options: string[]; onChange: (val: string) => void; placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200)
      });

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100px' }}>
      <EditInput
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        style={{ width: '100%', color: '#58A6FF', fontWeight: 500 }}
      />
      {isOpen && filteredOptions.length > 0 && createPortal(
        <SelectOptions style={{
          top: coords.top + 4,
          left: coords.left,
          width: coords.width,
          position: 'absolute',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {filteredOptions.map((opt) => (
            <SelectOption
              key={opt}
              active={value === opt}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </SelectOption>
          ))}
        </SelectOptions>,
        document.body
      )}
    </div>
  );
}

function TypeSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (val: string) => void }) {
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
            {options.map((t) => (
              <SelectOption
                key={t}
                active={value === t}
                onMouseDown={(e) => {
                  e.preventDefault();
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

const ExampleText = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 13px;
  color: #58A6FF;
  background: #F7FBFF;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  letter-spacing: -0.5px;
  white-space: nowrap;
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

const ChildrenContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  margin-top: 8px;
  border-left: 2px solid #E5E7EB;
  gap: 8px;
  width: 100%;
`;

const AddChildButton = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 1px dashed #D1D5DB;
  border-radius: 4px;
  color: #6B7280;
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  margin-left: 20px;
  &:hover {
    background: #F9FAFB;
    border-color: #9CA3AF;
  }
`;