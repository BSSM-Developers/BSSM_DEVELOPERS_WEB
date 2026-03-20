import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { loadGuideDetail } from "../data";
import { GuideDevEditor } from "./GuideDevEditor";
import { createPageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

interface GuideDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadGuideDetail(slug);
  const pathname = `/guide/${encodeURIComponent(slug)}`;

  if (!guide) {
    return createPageMetadata({
      title: "가이드",
      description: "BSSM Developers 가이드 문서",
      pathname,
    });
  }

  return createPageMetadata({
    title: guide.title,
    description: `${guide.title} 가이드 문서`,
    pathname: `/guide/${encodeURIComponent(guide.slug)}`,
  });
}

export default async function GuideDetailPage({ params, searchParams }: GuideDetailPageProps) {
  const { slug } = await params;
  const { mode } = await searchParams;
  const guide = await loadGuideDetail(slug);
  const isDevMode = process.env.NODE_ENV !== "production";
  const isEditMode = isDevMode && mode === "edit";

  if (!guide) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <DocsHeader title={guide.title} breadcrumb={["가이드"]} />
      {isDevMode && !isEditMode ? (
        <div className={styles.devToolbar}>
          <Link href="/guide/new" className={styles.devButton}>
            새 가이드
          </Link>
          <Link href={isEditMode ? `/guide/${slug}` : `/guide/${slug}?mode=edit`} className={styles.devButton}>
            {isEditMode ? "보기 모드" : "수정 모드"}
          </Link>
        </div>
      ) : null}
      {isEditMode ? (
        <GuideDevEditor slug={slug} initialTitle={guide.title} initialBlocks={guide.blocks} />
      ) : null}
      {!isEditMode ? (
      <section className={styles.content}>
        {guide.blocks.map((block, index) => (
          <DocsBlockViewer key={block.id ?? `${guide.id}-${index}`} block={block} />
        ))}
      </section>
      ) : null}
    </div>
  );
}
