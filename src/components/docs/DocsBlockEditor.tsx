"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import styled from "@emotion/styled";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Copy, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { DocsBlock } from "@/components/docs/DocsBlock";
import { ApiBlock } from "@/components/docs/ApiBlock";
import { DocsBlock as DocsBlockType } from "@/types/docs";
import { highlightCode } from "@/utils/apiUtils/highlightUtils";
import TextareaAutosize from "react-textarea-autosize";

interface DocsBlockEditorProps {
  block: DocsBlockType;
  index: number;
  onChange: (index: number, updated: DocsBlockType) => void;
  onAddBlock: (index: number, newBlock?: DocsBlockType) => void;
  onDuplicateBlock: (index: number) => void;
  onRemoveBlock?: (index: number) => void;
  onFocusMove?: (index: number, direction: "up" | "down") => void;
  isSelected?: boolean;
  isPrimarySelected?: boolean;
  groupDragOffset?: { x: number; y: number } | null;
  domain?: string;
}

type CodeLanguage = "javascript" | "python" | "json";

export const DocsBlockEditor = memo(function DocsBlockEditor({
  block,
  index,
  onChange,
  onAddBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onFocusMove,
  isSelected = false,
  isPrimarySelected = false,
  groupDragOffset = null,
  domain
}: DocsBlockEditorProps) {
  const [value, setValue] = useState(block.content ?? "");
  const [imageValue, setImageValue] = useState(block.imageSrc ?? "");
  const [showImageInput, setShowImageInput] = useState(!block.imageSrc);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const [imageWidth, setImageWidth] = useState<number | string>(block.imageWidth || "100%");
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id as string, disabled: isSelected && !isPrimarySelected });

  const shouldRenderGroupGhost = Boolean(groupDragOffset && isSelected && !isPrimarySelected);
  const sortableTranslate = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;
  const showHandleControls = !isSelected || isPrimarySelected;
  const style = {
    transform: shouldRenderGroupGhost
      ? `translate3d(${groupDragOffset?.x ?? 0}px, ${groupDragOffset?.y ?? 0}px, 0)`
      : sortableTranslate,
    transition: shouldRenderGroupGhost || isDragging ? "none" : transition,
    zIndex: shouldRenderGroupGhost ? 1900 : isDragging ? 2000 : 1000 - index,
    opacity: isDragging ? 0.5 : 1,
  };

  const requestFocus = () => {
    setTimeout(() => {
      const selector = `[data-block-id='${block.id}']`;
      const directInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `input${selector}, textarea${selector}`
      );
      if (directInput) {
        directInput.focus();
        return;
      }
      const codeMirrorContent = document.querySelector<HTMLElement>(`${selector} .cm-content`);
      codeMirrorContent?.focus();
    }, 0);
  };

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
  const CODE_LANGUAGE_OPTIONS: Array<{ value: CodeLanguage; label: string }> = [
    { value: "javascript", label: "JavaScript" },
    { value: "json", label: "JSON" },
    { value: "python", label: "Python" },
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
      onChange(index, { ...block, module: module as DocsBlockType["module"], content: "" });
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

  useEffect(() => {
    if (!showContextMenu) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showContextMenu]);

  useEffect(() => {
    if (!isLanguageMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isLanguageMenuOpen]);

  useEffect(() => {
    if (block.module !== "code") {
      setIsLanguageMenuOpen(false);
    }
  }, [block.module]);

  const normalizeCodeLanguage = (value?: string): CodeLanguage => {
    const normalized = (value || "").trim().toLowerCase();
    if (normalized === "py" || normalized === "python") {
      return "python";
    }
    if (normalized === "json" || normalized === "jsonc") {
      return "json";
    }
    if (normalized === "js" || normalized === "jsx" || normalized === "ts" || normalized === "tsx" || normalized === "javascript") {
      return "javascript";
    }
    return "javascript";
  };

  const selectedCodeLanguage: CodeLanguage = normalizeCodeLanguage(block.language);
  const selectedCodeLanguageLabel = selectedCodeLanguage === "python"
    ? "Python"
    : selectedCodeLanguage === "json"
      ? "JSON"
      : "JavaScript";
  const jsonEditorExtensions = useMemo(() => [json()], []);

  const detectModuleType = (
    text: string
  ): { module: DocsBlockType["module"]; content: string; imageSrc?: string; language?: string } | null => {
    if (/^#\s/.test(text)) return { module: "headline_1", content: text.replace(/^#\s*/, "") };
    if (/^##\s/.test(text)) return { module: "headline_2", content: text.replace(/^##\s*/, "") };
    if (/^-\s/.test(text)) return { module: "list", content: text.replace(/^-\s*/, "") };

    const closedFenceMatch = text.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```$/);
    if (closedFenceMatch) {
      return {
        module: "code",
        content: closedFenceMatch[2],
        language: normalizeCodeLanguage(closedFenceMatch[1]),
      };
    }

    const openFenceMatch = text.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*)$/);
    if (openFenceMatch) {
      return {
        module: "code",
        content: openFenceMatch[2],
        language: normalizeCodeLanguage(openFenceMatch[1]),
      };
    }

    if (/^!\[(.*)\]\s/.test(text)) {
      const match = text.match(/^!\[(.*)\]\s/);
      return { module: "image", content: "", imageSrc: match ? match[1] : "" };
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;

    if (block.module === "docs_1") {
      if (text.startsWith("/")) {
        setShowMenu(true);
        setMenuFilter(text.slice(1));
        setMenuIndex(0);
        setValue(text);
        return;
      } else if (showMenu) {
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
          imageSrc: detection.imageSrc,
          language: detection.language || block.language
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

    if (block.module === "code" && e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? start;
      const currentValue = target.value;
      const indent = "  ";

      if (e.shiftKey) {
        const before = currentValue.slice(0, start);
        const removeLength = before.endsWith(indent) ? indent.length : before.endsWith("\t") ? 1 : 0;
        if (removeLength > 0 && start === end) {
          const nextValue =
            currentValue.slice(0, start - removeLength) +
            currentValue.slice(end);
          const nextCursor = start - removeLength;
          setValue(nextValue);
          onChange(index, { ...block, content: nextValue });
          requestAnimationFrame(() => {
            target.setSelectionRange(nextCursor, nextCursor);
          });
        }
        return;
      }

      const nextValue = currentValue.slice(0, start) + indent + currentValue.slice(end);
      const nextCursor = start + indent.length;

      setValue(nextValue);
      onChange(index, { ...block, content: nextValue });

      requestAnimationFrame(() => {
        target.setSelectionRange(nextCursor, nextCursor);
      });
      return;
    }

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
      if (block.module === "code") {
        return;
      }
      e.preventDefault();
      onAddBlock(index, { module: block.module === "list" ? "list" : "docs_1", content: "" } as DocsBlockType);
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

  const renderContent = () => {
    if (block.module === "api" && block.apiData) {
      return (
        <ApiBlock
          apiData={block.apiData}
          domain={domain}
          editable={true}
          onChange={(updatedApiData) => onChange(index, { ...block, apiData: updatedApiData })}
        />
      );
    }

    if (block.module === "image") {
      return (
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
                <Image
                  src={block.imageSrc}
                  alt="Preview"
                  width={1200}
                  height={800}
                  unoptimized
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

                <div
                  className="resize-handle right"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.pageX;
                    const startWidth = containerRef.current?.offsetWidth || 0;
                    let finalWidth: number | string = startWidth;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = moveEvent.pageX - startX;
                      finalWidth = Math.max(100, startWidth + deltaX * 2);
                      setImageWidth(finalWidth);
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                      onChange(index, { ...block, imageWidth: finalWidth as number });
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                />

                <div
                  className="resize-handle left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.pageX;
                    const startWidth = containerRef.current?.offsetWidth || 0;
                    let finalWidth: number | string = startWidth;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = startX - moveEvent.pageX;
                      finalWidth = Math.max(100, startWidth + deltaX * 2);
                      setImageWidth(finalWidth);
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                      onChange(index, { ...block, imageWidth: finalWidth as number });
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
                  background: "white",
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
      );
    }

    const isCode = block.module === "code";
    const isList = block.module === "list";

    return (
      <DocsBlock module={isCode ? "default" : block.module}>
        {isList ? (
          <li style={{ width: "100%" }}>
            <TextareaAutosize
              value={value}
              onChange={(e) => handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
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
                resize: "none",
                overflow: "hidden",
                display: "block",
              }}
            />
          </li>
        ) : isCode ? (
          <div
            style={{
              width: "100%",
              background: isSelected ? "#dbeafe" : "#F3F4F6",
              borderRadius: "8px",
              padding: "12px",
              transition: "background 0.16s ease",
            }}
          >
            <div style={{ position: 'relative', width: '100%', background: '#0d1117', borderRadius: '8px', padding: '12px' }}>
            <CodeToolbar>
              <CodeLanguageDropdown ref={languageMenuRef}>
                <CodeLanguageTrigger
                  type="button"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsLanguageMenuOpen((prev) => !prev);
                  }}
                >
                  <span>{selectedCodeLanguageLabel}</span>
                  <CodeLanguageArrow open={isLanguageMenuOpen}>▼</CodeLanguageArrow>
                </CodeLanguageTrigger>
                {isLanguageMenuOpen ? (
                  <CodeLanguageMenu role="listbox" aria-label="코드 언어 선택">
                    {CODE_LANGUAGE_OPTIONS.map((option) => {
                      const isSelected = option.value === selectedCodeLanguage;
                      return (
                        <CodeLanguageOption
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          $selected={isSelected}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            onChange(index, { ...block, language: option.value });
                            setIsLanguageMenuOpen(false);
                          }}
                        >
                          {option.label}
                        </CodeLanguageOption>
                      );
                    })}
                  </CodeLanguageMenu>
                ) : null}
              </CodeLanguageDropdown>
            </CodeToolbar>
            {selectedCodeLanguage === "json" ? (
              <JsonCodeEditor data-block-id={block.id}>
                <CodeMirror
                  value={value}
                  height="120px"
                  placeholder={focused ? "{\n  \"key\": \"value\"\n}" : ""}
                  extensions={jsonEditorExtensions}
                  indentWithTab
                  theme="dark"
                  onChange={(nextValue) => {
                    setValue(nextValue);
                    onChange(index, { ...block, content: nextValue });
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false
                  }}
                />
              </JsonCodeEditor>
            ) : (
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
                    __html: highlightCode(value, selectedCodeLanguage) + '\n'
                  }}
                />
                <textarea
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    onChange(index, { ...block, content: e.target.value });
                  }}
                  onKeyDown={(e) => {
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
            )}
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%' }}>
            <TextareaAutosize
              value={value}
              onChange={(e) => handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
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
                background: "transparent",
                padding: "2px 4px",
                borderRadius: "4px",
                font: "inherit",
                color: "inherit",
                outline: "none",
                margin: 0,
                transition: "box-shadow 0.2s",
                resize: "none",
                overflow: "hidden",
                display: "block",
                cursor: "text"
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
            {showMenu && filteredOptions.length > 0 ? (
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
            ) : null}
          </div>
        )}
      </DocsBlock>
    );
  };

  return (
    <BlockContainer
      ref={setNodeRef}
      style={style}
      $selected={isSelected}
      data-docs-block-root="true"
      data-block-id={String(block.id)}
      className="block-editor-container"
    >
      {showHandleControls ? (
        <Gutter className="gutter-controls" $selected={isSelected}>
          <HandleGroup ref={contextMenuRef}>
            <DragHandle
              {...attributes}
              {...listeners}
              onMouseDownCapture={() => {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  selection.removeAllRanges();
                }
              }}
            >
              <GripVertical size={16} />
            </DragHandle>
            <MenuButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu((prev) => !prev);
              }}
              isActive={showContextMenu}
            >
              <MoreHorizontal size={14} />
            </MenuButton>
            {showContextMenu ? (
              <ContextMenu>
                <ContextMenuItem onClick={() => { onAddBlock(index); setShowContextMenu(false); }}>
                  <Plus size={14} />
                  아래 블록 추가
                </ContextMenuItem>
                <ContextMenuItem onClick={() => { onDuplicateBlock(index); setShowContextMenu(false); }}>
                  <Copy size={14} />
                  복제
                </ContextMenuItem>
                <ContextMenuItem isDelete onClick={() => { onRemoveBlock?.(index); setShowContextMenu(false); }}>
                  <Trash2 size={14} />
                  삭제
                </ContextMenuItem>
              </ContextMenu>
            ) : null}
          </HandleGroup>
        </Gutter>
      ) : null}

      <ContentArea onClick={(e) => { e.stopPropagation(); const selection = window.getSelection(); if (!selection || selection.toString().length === 0) { requestFocus(); } }}>
        {renderContent()}
      </ContentArea>
    </BlockContainer>
  );
});

const BlockContainer = styled.div<{ $selected: boolean }>`
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? "#e9f1ff" : "transparent")};
  box-shadow: ${({ $selected }) => ($selected ? "inset 0 0 0 1px rgba(59, 130, 246, 0.38)" : "none")};
  &:hover .gutter-controls {
    opacity: 1;
  }
`;

const Gutter = styled.div<{ $selected: boolean }>`
  position: absolute;
  left: -36px;
  top: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: ${({ $selected }) => ($selected ? 1 : 0)};
  transition: opacity 0.2s;
  z-index: 100;
`;

const HandleGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const DragHandle = styled.div`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ACB3BA;
  cursor: grab;
  border-radius: 4px;
  background: transparent;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  &:hover {
    background: #F2F4F6;
    color: #191F28;
  }
  &:active {
    cursor: grabbing;
  }
`;

const MenuButton = styled.button<{ isActive: boolean }>`
  width: 18px;
  height: 18px;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ isActive }) => (isActive ? "#191F28" : "#ACB3BA")};
  background: ${({ isActive }) => (isActive ? "#F2F4F6" : "transparent")};
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #F2F4F6;
    color: #191F28;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  width: 100%;
`;

const ContextMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 4px;
  width: 144px;
  margin-top: 4px;
  z-index: 1000;
`;

const ContextMenuItem = styled.div<{ isDelete?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  color: ${props => props.isDelete ? '#F04452' : '#191F28'};
  &:hover {
    background: #F2F4F6;
  }
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 4px;
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

const CodeToolbar = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  display: flex;
  gap: 8px;
`;

const CodeLanguageDropdown = styled.div`
  position: relative;
`;

const CodeLanguageTrigger = styled.button`
  min-width: 120px;
  height: 30px;
  border: 1px solid #30363d;
  border-radius: 7px;
  background: #171b22;
  color: #c9d1d9;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`;

const CodeLanguageArrow = styled.span<{ open: boolean }>`
  font-size: 10px;
  color: #8b949e;
  transition: transform 0.2s ease;
  transform: ${({ open }) => (open ? "rotate(180deg)" : "rotate(0deg)")};
`;

const CodeLanguageMenu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 140px;
  background: #171b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CodeLanguageOption = styled.button<{ $selected: boolean }>`
  width: 100%;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: ${({ $selected }) => ($selected ? "#16335c" : "transparent")};
  color: ${({ $selected }) => ($selected ? "#ffffff" : "#c9d1d9")};
  text-align: left;
  padding: 0 10px;
  font-size: 12px;
  font-weight: ${({ $selected }) => ($selected ? 700 : 500)};
  cursor: pointer;

  &:hover {
    background: ${({ $selected }) => ($selected ? "#16335c" : "#21262d")};
  }
`;

const JsonCodeEditor = styled.div`
  .cm-editor {
    border: none;
    background: transparent;
    font-family: monospace;
    font-size: 14px;
  }

  .cm-focused {
    outline: none;
  }

  .cm-scroller {
    min-height: 120px;
    font-family: monospace;
  }

  .cm-content {
    padding: 0;
    line-height: 1.5;
  }

  .cm-gutters {
    display: none;
  }
`;
