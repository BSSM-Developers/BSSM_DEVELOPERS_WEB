"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { DocsBlock } from "@/types/docs";
import { docsBlocksToMarkdown } from "@/utils/docsToMarkdown";

interface CopyToLLMButtonProps {
  blocks: DocsBlock[];
  projectTitle: string;
  pageTitle: string;
  breadcrumb: string[];
}

export function CopyToLLMButton({ blocks, projectTitle, pageTitle, breadcrumb }: CopyToLLMButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const markdown = docsBlocksToMarkdown(blocks, { projectTitle, pageTitle, breadcrumb });
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" onClick={handleCopy} copied={copied}>
      {copied ? "✓ Copied!" : "Copy to LLM"}
    </Button>
  );
}

const Button = styled.button<{ copied: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1.5px solid ${({ copied }) => (copied ? "#22c55e" : "#d1d5db")};
  background: ${({ copied }) => (copied ? "#f0fdf4" : "white")};
  color: ${({ copied }) => (copied ? "#22c55e" : "#6b7280")};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${({ copied }) => (copied ? "#22c55e" : "#16335c")};
    color: ${({ copied }) => (copied ? "#22c55e" : "#16335c")};
    background: ${({ copied }) => (copied ? "#f0fdf4" : "#f8fafc")};
  }
`;
