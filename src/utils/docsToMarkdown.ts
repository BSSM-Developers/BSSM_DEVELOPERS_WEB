import { DocsBlock, ApiDoc, ApiParam } from "@/types/docs";

function renderParams(params: ApiParam[], depth = 0): string {
  if (!params || params.length === 0) return "";

  const indent = "  ".repeat(depth);
  const lines: string[] = [];

  if (depth === 0) {
    lines.push(`| Name | Type | Required | Description | Example |`);
    lines.push(`|------|------|:--------:|-------------|---------|`);
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

function resolveApiData(block: DocsBlock): ApiDoc | null {
  if (block.apiData) return block.apiData;
  if (block.content && block.content.startsWith("{")) {
    try {
      const parsed = JSON.parse(block.content);
      if (parsed.method && parsed.endpoint) return parsed as ApiDoc;
    } catch {
      // not valid JSON
    }
  }
  return null;
}

function apiToMarkdown(api: ApiDoc): string {
  const parts: string[] = [];

  parts.push(`## ${api.name}`);
  if (api.description) parts.push(api.description);
  parts.push(`**\`${api.method} ${api.endpoint}\`**`);

  const paramGroups: { label: string; params?: ApiParam[] }[] = [
    { label: "Header Params", params: api.headerParams },
    { label: "Cookie Params", params: api.cookieParams },
    { label: "Path Params", params: api.pathParams },
    { label: "Query Params", params: api.queryParams },
    { label: "Body Params", params: api.bodyParams },
  ];

  const hasRequest = paramGroups.some((g) => g.params && g.params.length > 0);
  if (hasRequest) {
    parts.push("### Request");
    for (const { label, params } of paramGroups) {
      if (params && params.length > 0) {
        parts.push(`#### ${label}\n${renderParams(params)}`);
      }
    }
  }

  if (api.responseParams && api.responseParams.length > 0) {
    parts.push("### Response\n\n#### Response Body\n" + renderParams(api.responseParams));
  }

  if (api.sampleCode) {
    parts.push(`### Sample Request\n\n\`\`\`\n${api.sampleCode}\n\`\`\``);
  }

  if (api.responseCode || api.responseData) {
    const body = api.responseCode
      ? api.responseCode
      : typeof api.responseData === "string"
        ? api.responseData
        : JSON.stringify(api.responseData, null, 2);
    parts.push(`### Sample Response\n\n\`\`\`json\n${body}\n\`\`\``);
  }

  return parts.join("\n\n");
}

function parseCodeFence(content?: string): { language: string; code: string } | null {
  if (!content) return null;
  const match = content.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```$/);
  if (!match) return null;
  return { language: match[1] || "", code: match[2] };
}

function blockToMarkdown(block: DocsBlock): string | null {
  switch (block.module) {
    case "headline_1":
      return block.content ? `# ${block.content}` : null;
    case "headline_2":
      return block.content ? `## ${block.content}` : null;
    case "headline_3":
      return block.content ? `### ${block.content}` : null;
    case "api":
    case "docs_1": {
      const api = resolveApiData(block);
      if (api) return apiToMarkdown(api);
      if (block.module === "docs_1") {
        const fence = parseCodeFence(block.content);
        if (fence) return `\`\`\`${fence.language}\n${fence.code}\n\`\`\``;
        return block.content ?? null;
      }
      return null;
    }
    case "code":
      return `\`\`\`${block.language ?? ""}\n${block.content ?? ""}\n\`\`\``;
    case "list":
      return block.content ? `- ${block.content}` : null;
    case "image": {
      const src = block.imageSrc ?? block.content;
      return src ? `![image](${src})` : null;
    }
    case "main":
    case "main_title":
      return block.content ? `# ${block.content}` : null;
    case "big_space":
    case "space":
      return null;
    default:
      return block.content ?? null;
  }
}

export function docsBlocksToMarkdown(
  blocks: DocsBlock[],
  meta: { projectTitle: string; pageTitle: string; breadcrumb: string[] }
): string {
  const fullPath = [...meta.breadcrumb, meta.pageTitle].join(" / ");

  const header = [`# ${meta.projectTitle}`, `> ${fullPath}`, "---"].join("\n\n");

  const body = blocks
    .map(blockToMarkdown)
    .filter((s): s is string => s !== null && s.trim() !== "")
    .join("\n\n");

  return [header, body].filter(Boolean).join("\n\n");
}
