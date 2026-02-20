"use client";

import { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { Theme } from "@emotion/react";
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
  domain?: string;
}

export function DocsBlockEditor({ block, index, onChange, onAddBlock, onRemoveBlock, onFocusMove, domain }: DocsBlockEditorProps) {
  const [value, setValue] = useState(block.content ?? "");
  const [imageValue, setImageValue] = useState(block.imageSrc ?? "");
  const [showImageInput, setShowImageInput] = useState(!block.imageSrc);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageWidth, setImageWidth] = useState<number | string>(block.imageWidth || "100%");

  const requestFocus = () => {
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-block-id='${block.id}']`);
      el?.focus();
    }, 0);
  };

  // 슬래시 메뉴 상태
  const [showMenu, setShowMenu] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuFilter, setMenuFilter] = useState("");

  const MENU_OPTIONS = [
    { id: 'text', label: '텍스트', icon: 'T', module: 'docs_1' },
    { id: 'headline_1', label: '제목 1', icon: 'H1', module: 'headline_1' },
    { id: 'headline_2', label: '제목 2', icon: 'H2', module: 'headline_2' },
    { id: 'list', label: '리스트', icon: '•', module: 'list' },
    { id: 'code', label: '코드 블록', icon: '</>', module: 'code' },
    { id: 'image', label: '이미지', icon: 'IMG', module: 'image' },
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
      requestFocus();
    }
    setShowMenu(false);
    setMenuFilter("");
  };

  useEffect(() => {
    setValue(block.content ?? "");
  }, [block.content]);

  useEffect(() => {
    setImageValue(block.imageSrc ?? "");
  }, [block.imageSrc]);

  // 블록 타입 자동 판별
  const detectModuleType = (text: string): { module: DocsBlockType["module"]; content: string; imageSrc?: string } | null => {
    // 제목 1: "# "
    if (/^#\s/.test(text)) return { module: "headline_1", content: text.replace(/^#\s*/, "") };
    // 제목 2: "## "
    if (/^##\s/.test(text)) return { module: "headline_2", content: text.replace(/^##\s*/, "") };
    // 목록: "- "
    if (/^-\s/.test(text)) return { module: "list", content: text.replace(/^-\s*/, "") };
    // 코드: "``` "
    if (/^```\s/.test(text)) return { module: "code", content: text.replace(/^```\s*/, "") };
    // 이미지: "![] " 또는 "![url] "
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
      } else if (showMenu) {
        // 슬래시가 지워지면 메뉴 닫기
        setShowMenu(false);
        setMenuFilter("");
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
        requestFocus();
        return;
      }
    }

    setValue(text);
    onChange(index, { ...block, content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const composing = (e.nativeEvent as KeyboardEvent).isComposing || e.keyCode === 229;
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
      onAddBlock(index, { module: block.module === "list" ? "list" : "docs_1", content: "" });
      return;
    }

    if (e.key === "Backspace" && value === "") {
      e.preventDefault();
      if (block.module !== "docs_1") {
        onChange(index, { ...block, module: "docs_1", content: "" });
        requestFocus();
      } else {
        onRemoveBlock?.(index);
      }
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
      <BlockContainer style={{ zIndex: 1000 - index }}>
        <ApiBlock
          apiData={block.apiData}
          domain={domain}
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
      <BlockContainer style={{ zIndex: 1000 - index }}>
        <DocsBlock module="image">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {block.imageSrc ? (
              <div
                className="image-resize-container"
                ref={containerRef}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowImageInput(true);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: imageWidth,
                  maxWidth: '100%',
                  position: 'relative',
                  margin: '0 auto',
                }}
              >
                <img
                  src={block.imageSrc}
                  alt="Preview"
                  draggable={false}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    pointerEvents: 'none',
                    borderRadius: '8px'
                  }}
                />

                {/* Right Resize Handle */}
                <div
                  className="resize-handle right"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.pageX;
                    const startWidth = containerRef.current?.offsetWidth || 0;
                    let finalWidth = startWidth;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = moveEvent.pageX - startX;
                      // Since it's centered (margin: 0 auto), dragging right edge grows both sides
                      // Thus width increases by deltaX * 2
                      finalWidth = Math.max(100, startWidth + deltaX * 2);
                      setImageWidth(finalWidth);
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                      onChange(index, { ...block, imageWidth: finalWidth });
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                />

                {/* Left Resize Handle */}
                <div
                  className="resize-handle left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.pageX;
                    const startWidth = containerRef.current?.offsetWidth || 0;
                    let finalWidth = startWidth;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = startX - moveEvent.pageX;
                      finalWidth = Math.max(100, startWidth + deltaX * 2);
                      setImageWidth(finalWidth);
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                      onChange(index, { ...block, imageWidth: finalWidth });
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: "32px", border: "1px dashed #D1D5DB", borderRadius: "8px", background: "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%" }}>
                <div style={{ color: "#9CA3AF" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
                <div style={{ fontSize: "14px", color: "#6B7280" }}>이미지 URL을 입력하세요</div>
              </div>
            )}
            {showImageInput && (
              <>
                <input
                  value={imageValue}
                  onChange={(e) => {
                    setImageValue(e.target.value);
                    onChange(index, { ...block, imageSrc: e.target.value });
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (imageValue.trim() !== "") {
                        setShowImageInput(false);
                      }
                    }
                  }}
                  placeholder="https://... URL 입력 후 Enter를 누르세요"
                  onFocus={() => { setFocused(true); setShowImageInput(true); }}
                  onBlur={() => {
                    setFocused(false);
                    if (imageValue.trim() !== "") {
                      setShowImageInput(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    border: "1px solid transparent",
                    background: block.imageSrc ? "white" : "white",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    outline: "none",
                    color: "#4B5563",
                    transition: "all 0.2s",
                    boxShadow: block.imageSrc ? "0 1px 4px rgba(0,0,0,0.1)" : "0 1px 2px rgba(0,0,0,0.05)",
                    marginTop: block.imageSrc ? "4px" : "-24px",
                    position: "relative",
                    zIndex: 10,
                    maxWidth: block.imageSrc ? "100%" : "300px",
                    alignSelf: block.imageSrc ? "flex-start" : "center"
                  }}
                  className="image-url-input"
                  autoFocus
                />
              </>
            )}
            <style jsx>{`
              .image-url-input:focus, .image-url-input:hover {
                border-color: #E5E7EB;
                box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
              }
              .image-resize-container .resize-handle {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 8px;
                height: 48px;
                background-color: rgba(15, 15, 15, 0.2);
                border-radius: 4px;
                cursor: col-resize;
                opacity: 0;
                transition: opacity 0.2s, background-color 0.2s;
              }
              .image-resize-container .resize-handle.right {
                right: -16px;
              }
              .image-resize-container .resize-handle.left {
                left: -16px;
              }
              .image-resize-container:hover .resize-handle {
                opacity: 1;
              }
              .image-resize-container .resize-handle:hover {
                background-color: rgba(15, 15, 15, 0.4);
              }
            `}</style>
          </div>
        </DocsBlock>
        <AddBlockButton onClick={() => onAddBlock(index)} />
      </BlockContainer>
    );
  }

  const isCode = block.module === "code";
  const isList = block.module === "list";

  return (
    <BlockContainer style={{ zIndex: 1000 - index }}>
      <DocsBlock module={block.module}>
        {isList ? (
          <li style={{ width: "100%" }}>
            <input
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              data-block-id={block.id}
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
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  handleKeyDown(e);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                data-block-id={block.id}
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
                setTimeout(() => setShowMenu(false), 200);
              }}
              data-block-id={block.id}
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
                transition: "box-shadow 0.2s",
              }}
              className="docs-block-input"
            />
            <style jsx>{`
              .docs-block-input:hover {
                box-shadow: 0 0 0 1px #E5E7EB;
              }
              .docs-block-input:focus {
                box-shadow: none;
              }
            `}</style>
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
    pointer-events: auto;
  }
`;

const AddBlockButton = ({ onClick }: { onClick: () => void }) => (
  <AddBlockArea className="add-block-area">
    <AddCircle onClick={onClick} className="add-block-button">+</AddCircle>
  </AddBlockArea>
);

const AddBlockArea = styled.div`
  position: absolute;
  bottom: -16px;
  left: 0;
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 100;
  pointer-events: none;
`;

const AddCircle = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
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
    background: ${({ theme }) => theme.colors.bssmDarkBlue};
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


