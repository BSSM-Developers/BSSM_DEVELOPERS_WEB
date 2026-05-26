import { DocsBlock, ApiParam } from "@/types/docs";

function renderParams(params: ApiParam[], depth = 0): string {
  if (!params || params.length === 0) return "";

  const indent = "  ".repeat(depth);
  const lines: string[] = [];

  if (depth === 0) {
    lines.push(`${indent}| Name | Type | Required | Description | Example |`);
    lines.push(`${indent}|------|------|:--------:|-------------|---------|`);
  }

  for (const p of params) {
    const required = p.required ? "✓" : "-";
    const example = p.example ?? "-";
    const desc = p.description || "-";
    lines.push(`${indent}| \`${p.name}\` | ${p.type} | ${required} | ${desc} | ${example} |`);
    if (p.children && p.children.length > 0) {
      lines.push(renderParams(p.children, depth + 1));
    }
  }

  return lines.join("\n");
}

function apiBlockToMarkdown(block: DocsBlock): string {
  const api = block.apiData;
  if (!api) return "";

  const sections: string[] = [];

  sections.push(`## ${api.name}`);
  if (api.description) sections.push(`\n${api.description}`);
  sections.push(`\n**\`${api.method} ${api.endpoint}\`**`);

  const paramGroups: { label: string; params?: ApiParam[] }[] = [
    { label: "Header Params", params: api.headerParams },
    { label: "Cookie Params", params: api.cookieParams },
    { label: "Path Params", params: api.pathParams },
    { label: "Query Params", params: api.queryParams },
    { label: "Body Params", params: api.bodyParams },
  ];

  const hasRequest = paramGroups.some((g) => g.params && g.params.length > 0);
  if (hasRequest) {
    sections.push("\n### Request");
    for (const { label, params } of paramGroups) {
      if (params && params.length > 0) {
        sections.push(`\n#### ${label}\n${renderParams(params)}`);
      }
    }
  }

  if (api.responseParams && api.responseParams.length > 0) {
    sections.push("\n### Response\n\n#### Response Body");
    sections.push(renderParams(api.responseParams));
  }

  if (api.sampleCode) {
    sections.push(`\n### Sample Request\n\n\`\`\`\n${api.sampleCode}\n\`\`\``);
  }

  if (api.responseCode || api.responseData) {
    const responseBody = api.responseCode
      ? api.responseCode
      : typeof api.responseData === "string"
        ? api.responseData
        : JSON.stringify(api.responseData, null, 2);
    sections.push(`\n### Sample Response\n\n\`\`\`json\n${responseBody}\n\`\`\``);
  }

  return sections.join("\n");
}

function parseMarkdownCodeFence(content?: string): { language: string; code: string } | null {
  if (!content) return null;
  const match = content.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```$/);
  if (!match) return null;
  return { language: match[1] || "", code: match[2] };
}

export function docsBlocksToMarkdown(
  blocks: DocsBlock[],
  meta: { projectTitle: string; pageTitle: string; breadcrumb: string[] }
): string {
  const lines: string[] = [];

  // Document header
  const fullPath = [...meta.breadcrumb, meta.pageTitle].join(" / ");
  lines.push(`# ${meta.projectTitle}`);
  lines.push(`\n> ${fullPath}`);
  lines.push("\n---\n");

  for (const block of blocks) {
    switch (block.module) {
      case "headline_1":
        lines.push(`\n# ${block.content}`);
        break;
      case "headline_2":
        lines.push(`\n## ${block.content}`);
        break;
      case "docs_1": {
        const parsed = parseMarkdownCodeFence(block.content);
        if (parsed) {
          lines.push(`\n\`\`\`${parsed.language}\n${parsed.code}\n\`\`\``);
        } else if (block.apiData || (block.content && block.content.startsWith("{"))) {
          // api data embedded in docs_1
          const apiBlock = { ...block, module: "api" as const };
          lines.push(`\n${apiBlockToMarkdown(apiBlock)}`);
        } else {
          lines.push(`\n${block.content ?? ""}`);
        }
        break;
      }
      case "api":
        lines.push(`\n${apiBlockToMarkdown(block)}`);
        break;
      case "code":
        lines.push(`\n\`\`\`${block.language ?? ""}\n${block.content ?? ""}\n\`\`\``);
        break;
      case "list":
        lines.push(`- ${block.content}`);
        break;
      case "image":
        if (block.imageSrc || block.content) {
          lines.push(`\n![image](${block.imageSrc ?? block.content})`);
        }
        break;
      case "main":
      case "main_title":
        if (block.content) lines.push(`\n# ${block.content}`);
        break;
      default:
        if (block.content) lines.push(`\n${block.content}`);
        break;
    }
  }

  return lines.join("\n").trim();
}
