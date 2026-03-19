import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
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
const guideUploadsRoot = path.join(guidesRoot, "uploads");

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const normalizeSlug = (value: string): string => {
  try {
    return decodeURIComponent(value).normalize("NFC");
  } catch {
    return value.normalize("NFC");
  }
};

const isValidSlug = (value: string): boolean => /^[\p{L}\p{N}-]+$/u.test(value);

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

const parseGuideUpdatePayload = (value: unknown): { title: string; blocks: DocsBlock[] } | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.title !== "string" || !Array.isArray(value.blocks)) {
    return null;
  }
  const title = value.title.trim();
  if (!title) {
    return null;
  }
  const blocks = value.blocks.filter(isDocsBlock);
  if (blocks.length !== value.blocks.length) {
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

const toUploadsPublicPath = (fileName: string): string => `/guides/uploads/${fileName}`;

const persistImageBlocks = async (blocks: DocsBlock[]): Promise<DocsBlock[]> => {
  await mkdir(guideUploadsRoot, { recursive: true });

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
      const targetPath = path.join(guideUploadsRoot, fileName);
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "DEV 모드에서만 사용할 수 있습니다." }, { status: 403 });
  }

  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  if (!isValidSlug(normalizedSlug)) {
    return NextResponse.json({ message: "유효하지 않은 slug입니다." }, { status: 400 });
  }

  let payload: { title: string; blocks: DocsBlock[] } | null = null;
  try {
    const body = (await request.json()) as unknown;
    payload = parseGuideUpdatePayload(body);
  } catch {
    payload = null;
  }

  if (!payload) {
    return NextResponse.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const detailPath = path.join(guideItemsRoot, `${normalizedSlug}.json`);

  try {
    const normalizedBlocks = await persistImageBlocks(payload.blocks);
    const detail = await readJson<GuideDetailFile>(detailPath);
    const nextDetail: GuideDetailFile = {
      ...detail,
      title: payload.title,
      blocks: normalizedBlocks,
    };
    await saveJson(detailPath, nextDetail);

    const index = await readJson<{ items: GuideIndexItem[] }>(guideIndexPath);
    const nextItems = Array.isArray(index.items) ? [...index.items] : [];
    const currentIndex = nextItems.findIndex((item) => item.slug === normalizedSlug);

    if (currentIndex >= 0) {
      nextItems[currentIndex] = {
        ...nextItems[currentIndex],
        title: payload.title,
      };
    }

    await saveJson(guideIndexPath, { items: nextItems });
    return NextResponse.json({ message: "ok" });
  } catch {
    return NextResponse.json({ message: "가이드 파일 저장에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "DEV 모드에서만 사용할 수 있습니다." }, { status: 403 });
  }

  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  if (!isValidSlug(normalizedSlug)) {
    return NextResponse.json({ message: "유효하지 않은 slug입니다." }, { status: 400 });
  }

  const detailPath = path.join(guideItemsRoot, `${normalizedSlug}.json`);

  try {
    const index = await readJson<{ items: GuideIndexItem[] }>(guideIndexPath);
    const items = Array.isArray(index.items) ? [...index.items] : [];
    const nextItems = items.filter((item) => item.slug !== normalizedSlug);

    if (nextItems.length === items.length) {
      return NextResponse.json({ message: "삭제할 가이드를 찾을 수 없습니다." }, { status: 404 });
    }

    await saveJson(guideIndexPath, { items: nextItems });
    await unlink(detailPath).catch(() => undefined);

    return NextResponse.json({ message: "ok", nextSlug: nextItems[0]?.slug ?? null });
  } catch {
    return NextResponse.json({ message: "가이드 삭제에 실패했습니다." }, { status: 500 });
  }
}
