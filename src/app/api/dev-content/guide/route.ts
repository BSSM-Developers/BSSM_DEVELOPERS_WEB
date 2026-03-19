import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DocsBlock } from "@/types/docs";

export const runtime = "nodejs";

interface GuideIndexItem {
  id: string;
  slug: string;
  title: string;
}

interface GuideDetailFile {
  id: string;
  slug: string;
  title: string;
  blocks: DocsBlock[];
}

const guidesRoot = path.join(process.cwd(), "public", "guides");
const guideIndexPath = path.join(guidesRoot, "index.json");
const guideItemsRoot = path.join(guidesRoot, "items");

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isDocsBlock = (value: unknown): value is DocsBlock => {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.module !== "string" || value.module.trim().length === 0) {
    return false;
  }
  if ("content" in value && value.content !== undefined && typeof value.content !== "string") {
    return false;
  }
  return true;
};

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const ensureUniqueSlug = (baseSlug: string, used: Set<string>): string => {
  if (!used.has(baseSlug)) {
    return baseSlug;
  }
  let count = 2;
  while (used.has(`${baseSlug}-${count}`)) {
    count += 1;
  }
  return `${baseSlug}-${count}`;
};

const parseCreatePayload = (value: unknown): { title: string; blocks: DocsBlock[] } | null => {
  if (!isRecord(value) || typeof value.title !== "string" || !Array.isArray(value.blocks)) {
    return null;
  }
  const title = value.title.trim();
  const blocks = value.blocks.filter(isDocsBlock);
  if (!title || blocks.length === 0 || blocks.length !== value.blocks.length) {
    return null;
  }
  return { title, blocks };
};

const readJson = async <T>(targetPath: string): Promise<T> => {
  const raw = await readFile(targetPath, "utf-8");
  return JSON.parse(raw) as T;
};

const saveJson = async (targetPath: string, value: unknown): Promise<void> => {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(targetPath, serialized, "utf-8");
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "DEV 모드에서만 사용할 수 있습니다." }, { status: 403 });
  }

  let payload: { title: string; blocks: DocsBlock[] } | null = null;
  try {
    payload = parseCreatePayload((await request.json()) as unknown);
  } catch {
    payload = null;
  }

  if (!payload) {
    return NextResponse.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const index = await readJson<{ items: GuideIndexItem[] }>(guideIndexPath);
    const items = Array.isArray(index.items) ? [...index.items] : [];
    const usedSlugs = new Set(items.map((item) => item.slug));
    const base = slugify(payload.title) || "new-guide";
    const slug = ensureUniqueSlug(base, usedSlugs);
    const id = `guide-${Date.now()}`;

    const detail: GuideDetailFile = {
      id,
      slug,
      title: payload.title,
      blocks: payload.blocks,
    };

    items.unshift({ id, slug, title: payload.title });

    await saveJson(path.join(guideItemsRoot, `${slug}.json`), detail);
    await saveJson(guideIndexPath, { items });

    return NextResponse.json({ message: "ok", slug });
  } catch {
    return NextResponse.json({ message: "가이드 생성에 실패했습니다." }, { status: 500 });
  }
}
