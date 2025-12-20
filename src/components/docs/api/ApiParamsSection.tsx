"use client";

import styled from "@emotion/styled";
import { useState, useEffect } from "react";
import { ParamItem } from "@/components/ui/param/ParamItem";
import { validateParams } from "@/utils/apiUtils/paramUtils";

interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

interface ApiParamsSectionProps {
  title: string;
  params: ApiParam[];
  large?: boolean;
  showValidation?: boolean;
  editable?: boolean;
  onParamsChange?: (params: ApiParam[]) => void;
}

export function ApiParamsSection({
  title,
  params,
  large = false,
  showValidation = false,
  editable = false,
  onParamsChange
}: ApiParamsSectionProps) {
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: Record<string, string[]> }>({
    isValid: true,
    errors: {}
  });

  useEffect(() => {
    if (showValidation && params.length > 0) {
      const result = validateParams(params);
      setValidationResult(result);
    }
  }, [params, showValidation]);

  const handleAddParam = () => {
    const newParam: ApiParam = { name: "", type: "string", description: "", required: false };
    onParamsChange?.([...params, newParam]);
  };

  const handleUpdateParam = (index: number, updated: ApiParam) => {
    const nextParams = [...params];
    nextParams[index] = updated;
    onParamsChange?.(nextParams);
  };

  const handleDeleteParam = (index: number) => {
    const nextParams = params.filter((_, i) => i !== index);
    onParamsChange?.(nextParams);
  };

  if (params.length === 0 && !editable) return null;

  return (
    <ParamSection>
      <ParamSectionHeader>
        <ParamSectionTitle>{title}</ParamSectionTitle>
        {showValidation && (
          <ValidationIndicator isValid={validationResult.isValid}>
            {validationResult.isValid ? '✓ 유효' : '⚠ 오류'}
          </ValidationIndicator>
        )}
      </ParamSectionHeader>

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

      <ParamCard large={large}>
        <ParamList style={{ marginTop: 0 }}>
          {params.map((param, index) => (
            <ParamItem
              key={index}
              name={param.name}
              type={param.type}
              description={param.description}
              required={param.required}
              editable={editable}
              onChange={(updated) => handleUpdateParam(index, updated)}
              onDelete={() => handleDeleteParam(index)}
            />
          ))}
          {editable && (
            <AddParamButton onClick={handleAddParam}>
              + 파라미터 추가
            </AddParamButton>
          )}
        </ParamList>
      </ParamCard>
    </ParamSection>
  );
}

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

const ParamSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ParamSectionTitle = styled.h3`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: black;
  letter-spacing: -0.7px;
  margin: 0;
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

const ParamCard = styled.div<{ large?: boolean }>`
  background: white;
  border-radius: 8px;
  box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.25);
  padding: 12px 16px 10px 16px;
  width: 100%;
  min-height: ${({ large }) => large ? "240px" : "100px"};
  display: flex;
  flex-direction: column;
  align-items: stretch;

  @media (max-width: 768px) {
    padding: 10px 12px;
    min-height: ${({ large }) => large ? "180px" : "80px"};
  }

  @media (max-width: 480px) {
    padding: 8px;
    min-height: ${({ large }) => large ? "140px" : "70px"};
  }
`;

const ParamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 12px;
`;