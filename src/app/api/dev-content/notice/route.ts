import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DocsBlock } from "@/types/docs";

export const runtime = "nodejs";

interface NoticeIndexItem {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  publishedAt: string;
  pinned: boolean;
  author: string;
}

interface NoticeDetailFile {
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
const noticeIndexPath = path.join(noticesRoot, "index.json");
const noticeItemsRoot = path.join(noticesRoot, "items");
const noticeUploadsRoot = path.join(noticesRoot, "uploads");

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

const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/;

const mimeToExtension = (mime: string): string => {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "bin";
};

const toUploadsPublicPath = (fileName: string): string => `/notices/uploads/${fileName}`;

const persistImageBlocks = async (blocks: DocsBlock[]): Promise<DocsBlock[]> => {
  await mkdir(noticeUploadsRoot, { recursive: true });

  const nextBlocks = await Promise.all(
    blocks.map(async (block) => {
      if (block.module !== "image") {
        return block;
      }

      const source = (typeof block.imageSrc === "string" && block.imageSrc.trim().length > 0
        ? block.imageSrc
        : block.content || "").trim();

      if (!source) {
        return block;
      }

      const matched = source.match(DATA_URL_PATTERN);
      if (!matched) {
        return {
          ...block,
          imageSrc: source,
        };
      }

      const mime = matched[1].toLowerCase();
      const base64 = matched[2].replace(/\s+/g, "");
      const extension = mimeToExtension(mime);
      const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
      const targetPath = path.join(noticeUploadsRoot, fileName);
      const buffer = Buffer.from(base64, "base64");
      await writeFile(targetPath, buffer);

      return {
        ...block,
        imageSrc: toUploadsPublicPath(fileName),
        content: "",
      };
    })
  );

  return nextBlocks;
};

const deriveSummary = (blocks: DocsBlock[]): string | undefined => {
  const line = blocks
    .map((block) => (typeof block.content === "string" ? block.content.trim() : ""))
    .find((content) => content.length > 0);
  return line || undefined;
};

const deriveContent = (blocks: DocsBlock[]): string[] => {
  return blocks
    .map((block) => (typeof block.content === "string" ? block.content.trim() : ""))
    .filter((line) => line.length > 0);
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
    const normalizedBlocks = await persistImageBlocks(payload.blocks);
    const index = await readJson<{ items: NoticeIndexItem[] }>(noticeIndexPath);
    const items = Array.isArray(index.items) ? [...index.items] : [];
    const usedSlugs = new Set(items.map((item) => item.slug));
    const base = slugify(payload.title) || "new-notice";
    const slug = ensureUniqueSlug(base, usedSlugs);
    const id = `notice-${Date.now()}`;
    const now = new Date().toISOString();
    const summary = deriveSummary(normalizedBlocks);

    const detail: NoticeDetailFile = {
      id,
      slug,
      title: payload.title,
      summary,
      publishedAt: now,
      updatedAt: now,
      author: "BSSM Developers",
      content: deriveContent(normalizedBlocks),
      blocks: normalizedBlocks,
    };

    items.unshift({
      id,
      slug,
      title: payload.title,
      summary,
      publishedAt: now,
      pinned: false,
      author: "BSSM Developers",
    });

    await saveJson(path.join(noticeItemsRoot, `${slug}.json`), detail);
    await saveJson(noticeIndexPath, { items });

    return NextResponse.json({ message: "ok", slug });
  } catch {
    return NextResponse.json({ message: "공지사항 생성에 실패했습니다." }, { status: 500 });
  }
}
