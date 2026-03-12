"use client";

import { DocsBlock } from "@/components/docs/DocsBlock";
import { ApiBlock } from "@/components/docs/ApiBlock";
import { DocsBlock as DocsBlockType, ApiDoc } from "@/types/docs";
import { highlightCode } from "@/utils/apiUtils/highlightUtils";
import Image from "next/image";

interface DocsBlockViewerProps {
  block: DocsBlockType;
  domain?: string;
}

const parseMarkdownCodeFence = (content?: string): { language: string; code: string } | null => {
  if (!content) {
    return null;
  }
  const match = content.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```$/);
  if (!match) {
    return null;
  }
  const rawLanguage = (match[1] || "").trim().toLowerCase();
  const language =
    rawLanguage === "py" || rawLanguage === "python"
      ? "python"
      : rawLanguage === "js" ||
          rawLanguage === "jsx" ||
          rawLanguage === "ts" ||
          rawLanguage === "tsx" ||
          rawLanguage === "javascript"
        ? "javascript"
        : "javascript";
  return {
    language,
    code: match[2],
  };
};

export function DocsBlockViewer({ block, domain }: DocsBlockViewerProps) {
  if (block.module === "api" || block.module === "docs_1") {
    let data = block.apiData;
    if (!data && block.content && block.content.startsWith("{")) {
      try {
        const parsed = JSON.parse(block.content);
        if (parsed.method && parsed.endpoint) {
          data = parsed as ApiDoc;
        }
      } catch {
      }
    }

    if (data) {
      return (
        <DocsBlock module="api">
          <ApiBlock apiData={data} domain={domain} editable={false} />
        </DocsBlock>
      );
    }

    if (block.module === "api") return null;
  }

  if (block.module === "docs_1") {
    const parsedCodeFence = parseMarkdownCodeFence(block.content);
    if (parsedCodeFence) {
      return (
        <DocsBlock module="code">
          <div style={{ position: 'relative', width: '100%', background: '#0d1117', borderRadius: '8px', padding: '12px', overflow: 'hidden' }}>
            <pre
              style={{
                margin: 0,
                padding: 0,
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#c9d1d9',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
              dangerouslySetInnerHTML={{
                __html: highlightCode(parsedCodeFence.code, parsedCodeFence.language)
              }}
            />
          </div>
        </DocsBlock>
      );
    }
  }

  if (block.module === "image") {
    return (
      <DocsBlock module="image">
        {block.imageSrc ? (
          <Image
            src={block.imageSrc}
            alt="Content"
            width={1200}
            height={800}
            unoptimized
            style={{ width: "100%", height: "auto" }}
          />
        ) : null}
      </DocsBlock>
    );
  }

  if (block.module === "code") {
    return (
      <DocsBlock module="code">
        <div style={{ position: 'relative', width: '100%', background: '#0d1117', borderRadius: '8px', padding: '12px', overflow: 'hidden' }}>
          <pre
            style={{
              margin: 0,
              padding: 0,
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#c9d1d9',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
            dangerouslySetInnerHTML={{
              __html: highlightCode(block.content || "", block.language || "javascript")
            }}
          />
        </div>
      </DocsBlock>
    );
  }

  if (block.module === "list") {
    return (
      <DocsBlock module="list">
        <li>{block.content}</li>
      </DocsBlock>
    );
  }

  return (
    <DocsBlock module={block.module}>
      {block.content}
    </DocsBlock>
  );
}
