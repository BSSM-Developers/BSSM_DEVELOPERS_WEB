"use client";

import styled from "@emotion/styled";
import { useState, useEffect } from "react";
import { ParamItem } from "@/components/ui/param/ParamItem";
import { validateParams } from "@/utils/apiUtils/paramUtils";
import { useConfirm } from "@/hooks/useConfirm";

interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  example?: string;
  children?: ApiParam[];
  paramLocation?: 'header' | 'cookie' | 'query' | 'path' | 'body';
}

interface ApiParamsSectionProps {
  title: string;
  params: ApiParam[];
  showValidation?: boolean;
  editable?: boolean;
  paramLocation?: string;
  hideRequired?: boolean;
  onParamsChange?: (params: ApiParam[]) => void;
}

export function ApiParamsSection({
  title,
  params,
  showValidation = false,
  editable = false,
  paramLocation = 'body',
  hideRequired = false,
  onParamsChange
}: ApiParamsSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: Record<string, string[]> }>({
    isValid: true,
    errors: {}
  });

  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (showValidation && params.length > 0) {
      const result = validateParams(params);
      setValidationResult(result);
    }
  }, [params, showValidation]);

  const handleAddParam = (type: string = "string") => {
    const newParam: ApiParam = { name: "", type, description: "", required: false, example: "" };
    onParamsChange?.([...params, newParam]);
    if (!isOpen) setIsOpen(true);
  };

  const handleUpdateParam = (index: number, updated: ApiParam) => {
    const nextParams = [...params];
    nextParams[index] = updated;
    onParamsChange?.(nextParams);
  };

  const handleDeleteParam = async (index: number) => {
    const isConfirmed = await confirm({
      title: "파라미터 삭제",
      message: "정말 이 파라미터를 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소"
    });

    if (isConfirmed) {
      const nextParams = params.filter((_, i) => i !== index);
      onParamsChange?.(nextParams);
    }
  };

  if (params.length === 0 && !editable) return null;

  return (
    <ParamSection>
      <ParamSectionHeader as="button" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronIcon isOpen={isOpen}>▼</ChevronIcon>
          <ParamSectionTitle>{title}</ParamSectionTitle>
        </div>
        {showValidation && (
          <ValidationIndicator isValid={validationResult.isValid}>
            {validationResult.isValid ? '✓ 유효' : '⚠ 오류'}
          </ValidationIndicator>
        )}
      </ParamSectionHeader>

      {isOpen && (
        <>
          {showValidation && !validationResult.isValid && (
            <ValidationErrors>
              {Object.entries(validationResult.errors).map(([key, errors]) => (
                <ErrorItem key={key}>
                  <ErrorLabel>{key}:</ErrorLabel>
                  <ErrorList>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ErrorList>
                </ErrorItem>
              ))}
            </ValidationErrors>
          )}

          <ParamList style={{ marginTop: 0, padding: '0 8px', borderLeft: '2px solid #E5E7EB' }}>
            {params.map((param, index) => (
              <ParamItem
                key={index}
                name={param.name}
                type={param.type}
                description={param.description}
                required={param.required}
                example={param.example}
                childrenProps={param.children}
                paramLocation={paramLocation as any}
                editable={editable}
                hideRequired={hideRequired}
                onChange={(updated) => handleUpdateParam(index, updated)}
                onDelete={() => handleDeleteParam(index)}
              />
            ))}
            {editable && (
              <AddParamButtonComponent onAdd={(type) => handleAddParam(type)} />
            )}
          </ParamList>
        </>
      )}
      {ConfirmDialog}
    </ParamSection>
  );
}

function AddParamButtonComponent({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <AddParamButton onClick={() => onAdd("string")}>
      + 파라미터 추가
    </AddParamButton>
  );
}

const MenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
`;

const MenuContainer = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
`;

const MenuItem = styled.div`
  padding: 8px 12px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #4B5563;
  cursor: pointer;
  &:hover {
    background: #F3F4F6;
    color: #58A6FF;
  }
`;

const AddParamButton = styled.button`
  width: 100%;
  padding: 8px;
  border: 1px dashed #D1D5DB;
  border-radius: 6px;
  background: transparent;
  color: #6B7280;
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
  &:hover {
    background: #F9FAFB;
    border-color: #9CA3AF;
  }
`;

const ParamSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const ParamSectionHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
`;

const ParamSectionTitle = styled.h3`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: black;
  letter-spacing: -0.7px;
  margin: 0;
`;

const ChevronIcon = styled.span<{ isOpen: boolean }>`
  display: inline-block;
  font-size: 10px;
  color: #9CA3AF;
  transform: ${({ isOpen }) => isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'};
  transition: transform 0.2s ease;
`;

const ValidationIndicator = styled.span<{ isValid: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  color: ${({ isValid }) => isValid ? '#059669' : '#DC2626'};
  background: ${({ isValid }) => isValid ? '#ECFDF5' : '#FEF2F2'};
  border: 1px solid ${({ isValid }) => isValid ? '#10B981' : '#EF4444'};
`;

const ValidationErrors = styled.div`
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
`;

const ErrorItem = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ErrorLabel = styled.span`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #991B1B;
`;

const ErrorList = styled.ul`
  margin: 4px 0 0 0;
  padding-left: 16px;

  li {
    font-family: "Spoqa Han Sans Neo", sans-serif;
    font-size: 11px;
    color: #DC2626;
    margin-bottom: 2px;
  }
`;



const ParamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 12px;
`;