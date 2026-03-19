import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DocsBlock } from "@/types/docs";

export interface NoticeSummary {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  publishedAt: string;
  pinned: boolean;
  author: string;
}

export interface NoticeDetail {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  content: string[];
  blocks: DocsBlock[];
}

const noticesRoot = path.join(process.cwd(), "public", "notices");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isDocsBlock = (value: unknown): value is DocsBlock => {
  if (!isRecord(value)) {
    return false;
  }
  if (!isString(value.module)) {
    return false;
  }
  if ("content" in value && value.content !== undefined && !isString(value.content)) {
    return false;
  }
  return true;
};

const toNoticeSummary = (value: unknown): NoticeSummary | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isString(value.id) ||
    !isString(value.slug) ||
    !isString(value.title) ||
    !isString(value.publishedAt) ||
    !isBoolean(value.pinned) ||
    !isString(value.author)
  ) {
    return null;
  }

  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    summary: isString(value.summary) ? value.summary : undefined,
    publishedAt: value.publishedAt,
    pinned: value.pinned,
    author: value.author,
  };
};

const toNoticeDetail = (value: unknown): NoticeDetail | null => {
  if (!isRecord(value)) {
    return null;
  }

  const content = value.content;
  const isStringArray = Array.isArray(content) && content.every((item) => typeof item === "string");
  const blocksValue = value.blocks;
  const hasBlocks = Array.isArray(blocksValue) && blocksValue.every(isDocsBlock);

  if (
    !isString(value.id) ||
    !isString(value.slug) ||
    !isString(value.title) ||
    !isString(value.publishedAt) ||
    !isString(value.updatedAt) ||
    !isString(value.author) ||
    !isStringArray
  ) {
    return null;
  }

  const fallbackBlocks: DocsBlock[] = [
    { id: `${value.id}-title`, module: "headline_1", content: value.title },
    { id: `${value.id}-space`, module: "space" },
    ...content.map((paragraph, index) => ({
      id: `${value.id}-${index}`,
      module: "docs_1" as const,
      content: paragraph,
    })),
  ];

  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    summary: isString(value.summary) ? value.summary : undefined,
    publishedAt: value.publishedAt,
    updatedAt: value.updatedAt,
    author: value.author,
    content,
    blocks: hasBlocks ? (blocksValue as DocsBlock[]) : fallbackBlocks,
  };
};

const readJson = async (filePath: string): Promise<unknown> => {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
};

const decodeSlugSafe = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getSlugCandidates = (slug: string): string[] => {
  const base = decodeSlugSafe(slug);
  return Array.from(
    new Set([
      slug,
      base,
      slug.normalize("NFC"),
      slug.normalize("NFD"),
      base.normalize("NFC"),
      base.normalize("NFD"),
    ])
  );
};

export const loadNoticeSummaries = async (): Promise<NoticeSummary[]> => {
  const indexPath = path.join(noticesRoot, "index.json");
  const parsed = await readJson(indexPath);

  if (!isRecord(parsed) || !Array.isArray(parsed.items)) {
    throw new Error("공지사항 index.json 형식이 올바르지 않습니다.");
  }

  const items = parsed.items
    .map(toNoticeSummary)
    .filter((item): item is NoticeSummary => item !== null);

  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
};

export const loadNoticeDetail = async (slug: string): Promise<NoticeDetail | null> => {
  const candidates = getSlugCandidates(slug);
  for (const candidate of candidates) {
    const filePath = path.join(noticesRoot, "items", `${candidate}.json`);
    try {
      const parsed = await readJson(filePath);
      const detail = toNoticeDetail(parsed);
      if (detail) {
        return detail;
      }
    } catch {
    }
  }
  return null;
};
