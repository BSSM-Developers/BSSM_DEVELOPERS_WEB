"use client";

import styled from "@emotion/styled";
import { useState, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { ParamItem } from "@/components/ui/param/ParamItem";
import { generateParamExamples, validateParams } from "@/utils/apiUtils/paramUtils";
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
  enableJsonInput?: boolean;
  jsonInputLabel?: string;
  onParamsChange?: (params: ApiParam[]) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const inferPrimitiveType = (value: string | number | boolean | null): ApiParam["type"] => {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  return "string";
};

const primitiveToExample = (value: string | number | boolean | null): string => {
  if (value === null) {
    return "null";
  }
  return String(value);
};

const mapExistingParamsByName = (existingParams: ApiParam[] | undefined): Map<string, ApiParam> => {
  const map = new Map<string, ApiParam>();
  if (!existingParams) {
    return map;
  }

  for (const param of existingParams) {
    const normalizedName = param.name.trim();
    if (!normalizedName || map.has(normalizedName)) {
      continue;
    }
    map.set(normalizedName, param);
  }

  return map;
};

const mergeRecordShape = (base: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> => {
  const merged = { ...base };

  for (const [key, incomingValue] of Object.entries(incoming)) {
    const currentValue = merged[key];

    if (isRecord(currentValue) && isRecord(incomingValue)) {
      merged[key] = mergeRecordShape(currentValue, incomingValue);
      continue;
    }

    if (Array.isArray(currentValue) && Array.isArray(incomingValue)) {
      merged[key] = mergeArrayShape(currentValue, incomingValue);
      continue;
    }

    if (currentValue === undefined) {
      merged[key] = incomingValue;
      continue;
    }
  }

  return merged;
};

const mergeArrayShape = (base: unknown[], incoming: unknown[]): unknown[] => {
  if (base.length === 0) {
    return [...incoming];
  }

  if (incoming.length === 0) {
    return [...base];
  }

  const baseFirst = base[0];
  const incomingFirst = incoming[0];

  if (isRecord(baseFirst) && isRecord(incomingFirst)) {
    return [mergeRecordShape(baseFirst, incomingFirst)];
  }

  if (Array.isArray(baseFirst) && Array.isArray(incomingFirst)) {
    return [mergeArrayShape(baseFirst, incomingFirst)];
  }

  return [...base];
};

const getArrayObjectShape = (items: unknown[]): Record<string, unknown> | null => {
  const objectItems = items.filter((item): item is Record<string, unknown> => isRecord(item));
  if (objectItems.length === 0) {
    return null;
  }

  const [firstObject, ...restObjects] = objectItems;
  return restObjects.reduce((acc, item) => mergeRecordShape(acc, item), firstObject);
};

const jsonValueToParam = (name: string, value: unknown, existingParam?: ApiParam): ApiParam => {
  if (isRecord(value)) {
    const existingChildrenByName = mapExistingParamsByName(existingParam?.children);
    const children = Object.entries(value).map(([childKey, childValue]) =>
      jsonValueToParam(childKey, childValue, existingChildrenByName.get(childKey.trim()))
    );
    return {
      name,
      type: "object",
      description: existingParam?.description ?? "",
      required: existingParam?.required ?? false,
      example: existingParam?.example ?? "",
      children,
    };
  }

  if (Array.isArray(value)) {
    const objectShape = getArrayObjectShape(value);
    const existingArrayItem = existingParam?.children?.find((child) => child.name.trim().length === 0) ?? existingParam?.children?.[0];
    const existingObjectChildrenByName = mapExistingParamsByName(existingArrayItem?.children);
    let children: ApiParam[] = objectShape
      ? [{
        name: existingArrayItem?.name ?? "",
        type: "object",
        description: existingArrayItem?.description ?? "",
        required: existingArrayItem?.required ?? false,
        example: existingArrayItem?.example ?? "",
        children: Object.entries(objectShape).map(([childKey, childValue]) =>
          jsonValueToParam(childKey, childValue, existingObjectChildrenByName.get(childKey.trim()))
        )
      }]
      : [];

    if (!objectShape && value.length > 0) {
      const firstValue = value[0];
      const arrayItemName = existingArrayItem?.name ?? "";
      const arrayItemDescription = existingArrayItem?.description ?? "";
      const arrayItemRequired = existingArrayItem?.required ?? false;
      const arrayItemExample = existingArrayItem?.example ?? "";

      if (Array.isArray(firstValue)) {
        children.push({
          name: arrayItemName,
          type: "array",
          description: arrayItemDescription,
          required: arrayItemRequired,
          example: arrayItemExample
        });
      } else {
        const primitive = firstValue as string | number | boolean | null;
        children.push({
          name: arrayItemName,
          type: inferPrimitiveType(primitive),
          description: arrayItemDescription,
          required: arrayItemRequired,
          example: arrayItemExample || primitiveToExample(primitive)
        });
      }
    }

    return {
      name,
      type: "array",
      description: existingParam?.description ?? "",
      required: existingParam?.required ?? false,
      example: children.length > 0 ? "" : JSON.stringify(value),
      children: children.length > 0 ? children : undefined,
    };
  }

  const primitive = value as string | number | boolean | null;
  return {
    name,
    type: inferPrimitiveType(primitive),
    description: existingParam?.description ?? "",
    required: existingParam?.required ?? false,
    example: primitiveToExample(primitive),
  };
};

const jsonObjectToParams = (jsonObject: Record<string, unknown>, existingParams: ApiParam[]): ApiParam[] => {
  const existingByName = mapExistingParamsByName(existingParams);
  return Object.entries(jsonObject).map(([key, value]) => jsonValueToParam(key, value, existingByName.get(key.trim())));
};

const formatJsonParseError = (error: unknown, source: string): string => {
  if (!(error instanceof Error) || !error.message) {
    return "JSON 파싱 중 알 수 없는 오류가 발생했습니다.";
  }

  const message = error.message;
  const positionMatch = message.match(/position\s+(\d+)/i);
  if (!positionMatch) {
    return message;
  }

  const rawPosition = Number(positionMatch[1]);
  if (Number.isNaN(rawPosition)) {
    return message;
  }

  const safePosition = Math.max(0, Math.min(rawPosition, source.length));
  const before = source.slice(0, safePosition);
  const line = before.split("\n").length;
  const column = safePosition - before.lastIndexOf("\n");

  return `${message} (라인 ${line}, 열 ${column})`;
};

export function ApiParamsSection({
  title,
  params,
  showValidation = false,
  editable = false,
  paramLocation = 'body',
  hideRequired = false,
  enableJsonInput = false,
  jsonInputLabel = "Body",
  onParamsChange
}: ApiParamsSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: Record<string, string[]> }>({
    isValid: true,
    errors: {}
  });
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState("");
  const jsonEditorExtensions = useMemo(() => [json()], []);

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

  const openJsonModal = () => {
    const seed = params.length > 0 ? generateParamExamples(params) : {};
    setJsonDraft(JSON.stringify(seed, null, 2));
    setJsonError("");
    setJsonModalOpen(true);
  };

  const closeJsonModal = () => {
    setJsonModalOpen(false);
    setJsonError("");
  };

  const handleJsonBackdropMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    closeJsonModal();
  };

  const applyJsonDraft = () => {
    if (!onParamsChange) {
      closeJsonModal();
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonDraft);
    } catch (error: unknown) {
      setJsonError(formatJsonParseError(error, jsonDraft));
      return;
    }

    if (!isRecord(parsed)) {
      setJsonError("최상위는 JSON 객체({}) 형식이어야 합니다.");
      return;
    }

    const nextParams = jsonObjectToParams(parsed, params);
    onParamsChange(nextParams);
    if (!isOpen) {
      setIsOpen(true);
    }
    closeJsonModal();
  };

  const handleJsonEditorChange = (value: string) => {
    setJsonDraft(value);
    setJsonError((prev) => (prev ? "" : prev));
  };

  const handleJsonEditorBlur = () => {
    const trimmed = jsonDraft.trim();
    if (!trimmed) {
      return;
    }

    try {
      const formatted = JSON.stringify(JSON.parse(jsonDraft), null, 2);
      if (formatted !== jsonDraft) {
        setJsonDraft(formatted);
      }
    } catch {
      return;
    }
  };

  if (params.length === 0 && !editable) return null;

  return (
    <ParamSection>
      <ParamSectionHeader type="button" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
          <ChevronIcon isOpen={isOpen}>▼</ChevronIcon>
          <ParamSectionTitle>{title}</ParamSectionTitle>
        </div>
        {showValidation && (
          <ValidationIndicator isValid={validationResult.isValid}>
            {validationResult.isValid ? '✓ 유효' : '⚠ 오류'}
          </ValidationIndicator>
        )}
      </ParamSectionHeader>

      {enableJsonInput && editable && (
        <JsonImportRow>
          <JsonImportButton type="button" onClick={openJsonModal}>
            JSON으로 입력
          </JsonImportButton>
        </JsonImportRow>
      )}

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
                paramLocation={paramLocation === 'response' ? undefined : (paramLocation as 'header' | 'cookie' | 'path' | 'query' | 'body')}
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
      {jsonModalOpen && typeof document !== "undefined" && createPortal(
        <JsonModalBackdrop onMouseDown={handleJsonBackdropMouseDown}>
            <JsonModalCard onClick={(event) => event.stopPropagation()}>
            <JsonModalTitle>{jsonInputLabel} JSON 입력</JsonModalTitle>
            <JsonModalDescription>JSON을 붙여넣으면 {jsonInputLabel} 파라미터가 자동 생성됩니다.</JsonModalDescription>
            <JsonCodeEditor>
              <CodeMirror
                value={jsonDraft}
                height="260px"
                placeholder='{"post_id":"abc123","title":"제목","enabled":true}'
                extensions={jsonEditorExtensions}
                indentWithTab
                onChange={handleJsonEditorChange}
                onBlur={handleJsonEditorBlur}
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  highlightActiveLine: false,
                  highlightActiveLineGutter: false
                }}
              />
            </JsonCodeEditor>
            {jsonError ? <JsonError>{jsonError}</JsonError> : null}
            <JsonModalActions>
              <JsonActionButton type="button" onClick={closeJsonModal}>
                취소
              </JsonActionButton>
              <JsonActionButton type="button" primary onClick={applyJsonDraft}>
                적용
              </JsonActionButton>
            </JsonModalActions>
          </JsonModalCard>
        </JsonModalBackdrop>,
        document.body
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
  padding: 4px 0;
  text-align: left;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.6;
  }
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

const JsonImportRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
`;

const JsonImportButton = styled.button`
  height: 30px;
  padding: 0 12px;
  border-radius: 7px;
  border: 1px solid #D1D5DB;
  background: #FFFFFF;
  color: #4B5563;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #16335C;
    color: #16335C;
    background: #F8FAFC;
  }
`;

const JsonModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 40, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const JsonModalCard = styled.div`
  width: min(760px, 100%);
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  box-shadow: 0 10px 30px rgba(15, 23, 40, 0.22);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const JsonModalTitle = styled.h4`
  margin: 0;
  color: #191F28;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.8px;
`;

const JsonModalDescription = styled.p`
  margin: 0;
  color: #6B7280;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  line-height: 1.4;
`;

const JsonCodeEditor = styled.div`
  width: 100%;
  border-radius: 10px;
  border: 1px solid #D1D5DB;
  background: #F8FAFC;
  overflow: hidden;

  &:focus-within {
    border-color: #16335C;
    box-shadow: 0 0 0 2px rgba(22, 51, 92, 0.15);
    background: #FFFFFF;
  }

  .cm-editor {
    min-height: 260px;
    background: transparent;
  }

  .cm-scroller {
    font-family: "SFMono-Regular", "Menlo", "Monaco", "Consolas", monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  .cm-content {
    padding: 12px;
  }

  .cm-focused {
    outline: none;
  }
`;

const JsonError = styled.div`
  color: #DC2626;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 500;
`;

const JsonModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const JsonActionButton = styled.button<{ primary?: boolean }>`
  min-width: 76px;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ primary }) => (primary ? "#16335C" : "#D1D5DB")};
  background: ${({ primary }) => (primary ? "#16335C" : "#FFFFFF")};
  color: ${({ primary }) => (primary ? "#FFFFFF" : "#4B5563")};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;
