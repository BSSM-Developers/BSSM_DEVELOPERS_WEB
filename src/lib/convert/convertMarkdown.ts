import { DocsBlock } from "@/types/docs";

export function convertMarkdown(content: string): DocsBlock[] {
  const blocks: DocsBlock[] = [];
  const lines = content.split(/\r?\n/);

  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ module: "list", listItems: [...currentList] });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushList();
      continue;
    }

    if (/^#{1,2}\s/.test(trimmed)) {
      flushList();
      blocks.push({
        module: "headline_1",
        content: trimmed.replace(/^#{1,2}\s*/, "").trim(),
      });
      continue;
    }

    if (/^#{3,4}\s/.test(trimmed)) {
      flushList();
      blocks.push({
        module: "headline_2",
        content: trimmed.replace(/^#{3,4}\s*/, "").trim(),
      });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^[-*]\s+/, "").trim());
      continue;
    }

    flushList();
    blocks.push({
      module: "docs_1",
      content: trimmed,
    });
  }

  flushList();
  return blocks;
}
