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
  status?: number;
  message?: string;
  responseData?: any;
  onStatusChange?: (status: number) => void;
  onMessageChange?: (message: string) => void;
  onDataChange?: (data: any) => void;
}

export function ApiResponseSection({
  responseParams = [],
  title = "Response",
  editable = false,
  onParamsChange,
  status = 200,
  message = "성공",
  responseData = null,
  onStatusChange,
  onMessageChange,
  onDataChange
}: ApiResponseSectionProps) {
  const hasParams = responseParams.length > 0 || editable;

  if (!hasParams) return null;

  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      onDataChange?.(parsed);
    } catch (err) {
    }
  };

  return (
    <ResponseSection>
      <SectionTitle>{title}</SectionTitle>

      {editable && (
        <EditSection>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Label>Status Code</Label>
              <EditInput
                type="number"
                value={isNaN(status) ? '' : status}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onStatusChange?.(isNaN(val) ? 0 : val);
                }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <Label>Message</Label>
              <EditInput
                value={message}
                onChange={(e) => onMessageChange?.(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <Label>Response Data (JSON)</Label>
            <EditTextarea
              defaultValue={JSON.stringify(responseData, null, 2)}
              onChange={handleDataChange}
              placeholder='{"key": "value"}'
            />
          </div>
        </EditSection>
      )}

      <ApiParamsSection
        title="Response Body"
        params={responseParams}
        editable={editable}
        paramLocation="body"
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
