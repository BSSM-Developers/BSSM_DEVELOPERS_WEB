"use client";

import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { DocsBlock } from "@/components/docs/DocsBlock";
import { ApiBlock } from "@/components/docs/ApiBlock";
import { DocsBlock as DocsBlockType } from "@/types/docs";
import { highlightCode } from "@/utils/apiUtils/highlightUtils";

interface DocsBlockEditorProps {
  block: DocsBlockType;
  index: number;
  onChange: (index: number, updated: DocsBlockType) => void;
  onAddBlock: (index: number, newBlock?: DocsBlockType) => void;
  onRemoveBlock?: (index: number) => void;
  onFocusMove?: (index: number, direction: "up" | "down") => void;
}

export function DocsBlockEditor({ block, index, onChange, onAddBlock, onRemoveBlock, onFocusMove }: DocsBlockEditorProps) {
  const [value, setValue] = useState(block.content ?? "");
  const [focused, setFocused] = useState(false);

  // 슬래시 메뉴 상태
  const [showMenu, setShowMenu] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuFilter, setMenuFilter] = useState("");

  const MENU_OPTIONS = [
    { id: 'headline_1', label: '제목 1', icon: 'H1', module: 'headline_1' },
    { id: 'headline_2', label: '제목 2', icon: 'H2', module: 'headline_2' },
    { id: 'list', label: '리스트', icon: '•', module: 'list' },
    { id: 'code', label: '코드 블록', icon: '</>', module: 'code' },
    { id: 'image', label: '이미지', icon: 'IMG', module: 'image' },
    { id: 'api', label: 'API 명세', icon: 'API', module: 'api' },
  ];

  const filteredOptions = MENU_OPTIONS.filter(opt =>
    opt.label.toLowerCase().includes(menuFilter.toLowerCase()) ||
    opt.id.toLowerCase().includes(menuFilter.toLowerCase())
  );

  const selectModule = (module: string) => {
    if (module === 'api') {
      onChange(index, {
        ...block,
        module: 'api',
        apiData: {
          id: Math.random().toString(36).substring(2, 11),
          name: "새 API",
          method: "GET",
          endpoint: "/api/v1/endpoint",
          description: "API 설명을 입력하세요"
        }
      });
    } else {
      onChange(index, { ...block, module: module as any, content: "" });
      setValue("");
    }
    setShowMenu(false);
    setMenuFilter("");
  };

  useEffect(() => {
    setValue(block.content ?? "");
  }, [block.content]);

  // 블록 타입 자동 판별
  const detectModuleType = (text: string): { module: DocsBlockType["module"]; content: string; imageSrc?: string } | null => {
    // Headline 1: "# "
    if (/^#\s/.test(text)) return { module: "headline_1", content: text.replace(/^#\s*/, "") };
    // Headline 2: "## "
    if (/^##\s/.test(text)) return { module: "headline_2", content: text.replace(/^##\s*/, "") };
    // List: "- "
    if (/^-\s/.test(text)) return { module: "list", content: text.replace(/^-\s*/, "") };
    // Code: "``` " (trigger on space after backticks)
    if (/^```\s/.test(text)) return { module: "code", content: text.replace(/^```\s*/, "") };
    // Image: "![] " or "![url] "
    if (/^!\[(.*)\]\s/.test(text)) {
      const match = text.match(/^!\[(.*)\]\s/);
      return { module: "image", content: "", imageSrc: match ? match[1] : "" };
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;

    if (block.module === "docs_1") {
      // 슬래시 메뉴 감지
      if (text.startsWith("/")) {
        setShowMenu(true);
        setMenuFilter(text.slice(1));
        setMenuIndex(0);
        setValue(text);
        return;
      }

      const detection = detectModuleType(text);
      if (detection) {
        setValue(detection.content);
        onChange(index, {
          ...block,
          module: detection.module,
          content: detection.content,
          imageSrc: detection.imageSrc
        });
        return;
      }
    } else if (text.trim() === "") {
      // Reset to docs_1 if cleared
      setValue("");
      onChange(index, { ...block, module: "docs_1", content: "" });
      return;
    }

    setValue(text);
    onChange(index, { ...block, content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const composing = (e.nativeEvent as any)?.isComposing || (e as any).keyCode === 229;
    if (composing) return;

    if (showMenu) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenuIndex(prev => (prev + 1) % Math.max(1, filteredOptions.length));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMenuIndex(prev => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions[menuIndex]) {
          selectModule(filteredOptions[menuIndex].module);
        }
        return;
      }
      if (e.key === "Escape") {
        setShowMenu(false);
        setMenuFilter("");
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      onAddBlock(index, { module: "docs_1", content: "" });
      return;
    }

    if (e.key === "Backspace" && value === "") {
      e.preventDefault();
      onRemoveBlock?.(index);
      return;
    }

    if (e.key === "ArrowUp") {
      const caret = (e.currentTarget.selectionStart ?? 0);
      if (caret === 0) {
        e.preventDefault();
        onFocusMove?.(index, "up");
        return;
      }
    }

    if (e.key === "ArrowDown") {
      const caret = (e.currentTarget.selectionStart ?? 0);
      const len = e.currentTarget.value.length;
      if (caret === len) {
        e.preventDefault();
        onFocusMove?.(index, "down");
        return;
      }
    }

  };


  // API 블록인 경우 특별한 렌더링
  if (block.module === "api" && block.apiData) {
    return (
      <BlockContainer>
        <ApiBlock
          apiData={block.apiData}
          editable={true}
          onChange={(updatedApiData) => onChange(index, { ...block, apiData: updatedApiData })}
        />
        <AddBlockButton onClick={() => onAddBlock(index)} />
      </BlockContainer>
    );
  }

  // 이미지 블록인 경우
  if (block.module === "image") {
    return (
      <BlockContainer>
        <DocsBlock module="image">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {block.imageSrc && <img src={block.imageSrc} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />}
            <input
              value={block.imageSrc || ""}
              onChange={(e) => onChange(index, { ...block, imageSrc: e.target.value })}
              placeholder="이미지 URL을 입력하세요"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                width: "100%",
                border: "1px solid #E5E7EB",
                background: "white",
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>
        </DocsBlock>
        <AddBlockButton onClick={() => onAddBlock(index)} />
      </BlockContainer>
    );
  }

  const isCode = block.module === "code";
  const isList = block.module === "list";

  return (
    <BlockContainer>
      <DocsBlock module={block.module}>
        {isList ? (
          <li style={{ width: "100%" }}>
            <input
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              data-block-id={(block as any).id}
              placeholder={focused ? "내용을 입력하세요" : ""}
              style={{
                width: "100%",
                border: "none",
                background: "white",
                padding: "2px 0",
                borderRadius: "4px",
                font: "inherit",
                color: "inherit",
                outline: "none",
                margin: 0,
              }}
            />
          </li>
        ) : isCode ? (
          <div style={{ position: 'relative', width: '100%', background: '#0d1117', borderRadius: '8px', padding: '12px' }}>
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 20,
              display: 'flex',
              gap: '8px'
            }}>
              <select
                value={block.language || "javascript"}
                onChange={(e) => onChange(index, { ...block, language: e.target.value })}
                style={{
                  background: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '4px',
                  fontSize: '12px',
                  padding: '2px 4px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
            </div>
            <div style={{ position: 'relative', minHeight: '120px' }}>
              <pre
                aria-hidden="true"
                style={{
                  margin: 0,
                  padding: 0,
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#c9d1d9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden'
                }}
                dangerouslySetInnerHTML={{
                  __html: highlightCode(value, block.language || "javascript") + '\n'
                }}
              />
              <textarea
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  onChange(index, { ...block, content: e.target.value });
                }}
                onKeyDown={(e: any) => {
                  handleKeyDown(e);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                data-block-id={(block as any).id}
                placeholder={focused ? "코드를 입력하세요" : ""}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  border: "none",
                  background: "transparent",
                  padding: "0",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  lineHeight: '1.5',
                  color: "transparent",
                  caretColor: "#c9d1d9",
                  outline: "none",
                  margin: 0,
                  resize: "vertical",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  position: 'relative',
                  zIndex: 10,
                  display: 'block'
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                // 메뉴 클릭을 허용하기 위해 약간의 지연 후 닫기
                setTimeout(() => setShowMenu(false), 200);
              }}
              data-block-id={(block as any).id}
              placeholder={focused ? "내용을 입력하세요" : ""}
              style={{
                width: "100%",
                border: "none",
                background: "white",
                padding: "2px 12px",
                borderRadius: "4px",
                font: "inherit",
                color: "inherit",
                outline: "none",
                margin: 0,
              }}
            />
            {showMenu && filteredOptions.length > 0 && (
              <MenuContainer>
                {filteredOptions.map((opt, i) => (
                  <MenuItem
                    key={opt.id}
                    active={i === menuIndex}
                    onClick={() => selectModule(opt.module)}
                    onMouseEnter={() => setMenuIndex(i)}
                  >
                    <MenuIcon>{opt.icon}</MenuIcon>
                    <MenuLabel>{opt.label}</MenuLabel>
                  </MenuItem>
                ))}
              </MenuContainer>
            )}
          </div>
        )}
      </DocsBlock>
      <AddBlockButton onClick={() => onAddBlock(index)} />
    </BlockContainer>
  );
}

const BlockContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 0;
  &:hover > .add-block-area {
    opacity: 1;
  }
`;

const AddBlockButton = ({ onClick }: { onClick: () => void }) => (
  <AddBlockArea className="add-block-area">
    <AddCircle onClick={onClick}>+</AddCircle>
  </AddBlockArea>
);

const AddBlockArea = styled.div`
  position: absolute;
  bottom: -12px;
  left: 0;
  right: 0;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
  pointer-events: none;
`;

const AddCircle = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #58A6FF;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  margin: 0 10px;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  &:hover {
    background: #1a7fec;
    transform: scale(1.2);
  }
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 12px;
  z-index: 100;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 200px;
  padding: 4px;
  margin-top: 4px;
`;

const MenuItem = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  background: ${props => props.active ? '#F3F4F6' : 'transparent'};
  &:hover {
    background: #F3F4F6;
  }
`;

const MenuIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  color: #6B7280;
`;

const MenuLabel = styled.div`
  font-size: 14px;
  color: #374151;
`;


