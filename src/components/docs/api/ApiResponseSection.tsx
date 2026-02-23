"use client";

import styled from "@emotion/styled";
import { ApiParamsSection } from "./ApiParamsSection";

interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  example?: string;
}

interface ApiResponseSectionProps {
  responseParams?: ApiParam[];
  title?: string;
  editable?: boolean;
  onParamsChange?: (params: ApiParam[]) => void;
}

export function ApiResponseSection({
  responseParams = [],
  title = "Response",
  editable = false,
  onParamsChange
}: ApiResponseSectionProps) {
  const hasParams = responseParams.length > 0 || editable;

  if (!hasParams) return null;

  return (
    <ResponseSection>
      <SectionTitle>{title}</SectionTitle>

      {/* Removed traditional manual status/message edit blocks to enforce UI cleanup */}

      <ApiParamsSection
        title="Response Body"
        params={responseParams}
        editable={editable}
        paramLocation="body"
        hideRequired={true}
        onParamsChange={onParamsChange}
      />
    </ResponseSection>
  );
}

const EditSection = styled.div`
  display: flex;
  flex-direction: column;
  background: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6B7684;
  margin-bottom: 4px;
`;

const EditInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  background: white;
  color: #191F28;
  &:focus {
    border-color: #58A6FF;
  }
`;

const EditTextarea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
  outline: none;
  background: white;
  resize: vertical;
  color: #191F28;
  &:focus {
    border-color: #58A6FF;
  }
`;

const ResponseSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 24px;
  color: #191F28;
  letter-spacing: -1.2px;
  margin: 0;
`;
