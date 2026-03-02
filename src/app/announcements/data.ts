import { readFile } from "node:fs/promises";
import path from "node:path";

export interface NoticeSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  pinned: boolean;
  author: string;
}

export interface NoticeDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  content: string[];
}

const noticesRoot = path.join(process.cwd(), "public", "notices");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const toNoticeSummary = (value: unknown): NoticeSummary | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isString(value.id) ||
    !isString(value.slug) ||
    !isString(value.title) ||
    !isString(value.summary) ||
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
    summary: value.summary,
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

  if (
    !isString(value.id) ||
    !isString(value.slug) ||
    !isString(value.title) ||
    !isString(value.summary) ||
    !isString(value.publishedAt) ||
    !isString(value.updatedAt) ||
    !isString(value.author) ||
    !isStringArray
  ) {
    return null;
  }

  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    summary: value.summary,
    publishedAt: value.publishedAt,
    updatedAt: value.updatedAt,
    author: value.author,
    content,
  };
};

const readJson = async (filePath: string): Promise<unknown> => {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
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
  const filePath = path.join(noticesRoot, "items", `${slug}.json`);

  try {
    const parsed = await readJson(filePath);
    return toNoticeDetail(parsed);
  } catch {
    return null;
  }
};
