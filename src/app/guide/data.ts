import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DocsBlock } from "@/types/docs";

export interface GuideSummary {
  id: string;
  slug: string;
  title: string;
}

export interface GuideDetail {
  id: string;
  slug: string;
  title: string;
  blocks: DocsBlock[];
}

const guidesRoot = path.join(process.cwd(), "public", "guides");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isDocsBlock = (value: unknown): value is DocsBlock => {
  if (!isRecord(value) || !isString(value.module)) {
    return false;
  }

  if ("content" in value && value.content !== undefined && !isString(value.content)) {
    return false;
  }

  return true;
};

const toGuideSummary = (value: unknown): GuideSummary | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (!isString(value.id) || !isString(value.slug) || !isString(value.title)) {
    return null;
  }

  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
  };
};

const toGuideDetail = (value: unknown): GuideDetail | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (!isString(value.id) || !isString(value.slug) || !isString(value.title) || !Array.isArray(value.blocks)) {
    return null;
  }

  const blocks = value.blocks.filter(isDocsBlock);

  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    blocks,
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

export const loadGuideSummaries = async (): Promise<GuideSummary[]> => {
  const indexPath = path.join(guidesRoot, "index.json");
  const parsed = await readJson(indexPath);

  if (!isRecord(parsed) || !Array.isArray(parsed.items)) {
    throw new Error("가이드 index.json 형식이 올바르지 않습니다.");
  }

  return parsed.items.map(toGuideSummary).filter((item): item is GuideSummary => item !== null);
};

export const loadGuideDetail = async (slug: string): Promise<GuideDetail | null> => {
  const candidates = getSlugCandidates(slug);
  for (const candidate of candidates) {
    const filePath = path.join(guidesRoot, "items", `${candidate}.json`);
    try {
      const parsed = await readJson(filePath);
      const detail = toGuideDetail(parsed);
      if (detail) {
        return detail;
      }
    } catch {
    }
  }
  return null;
};
