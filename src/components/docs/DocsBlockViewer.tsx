"use client";

import { DocsBlock } from "@/components/docs/DocsBlock";
import { ApiBlock } from "@/components/docs/ApiBlock";
import { DocsBlock as DocsBlockType, ApiDoc } from "@/types/docs";
import { highlightCode } from "@/utils/apiUtils/highlightUtils";

interface DocsBlockViewerProps {
  block: DocsBlockType;
  domain?: string;
}

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

  if (block.module === "image") {
    return (
      <DocsBlock module="image">
        {block.imageSrc && <img src={block.imageSrc} alt="Content" />}
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
