import { notFound } from "next/navigation";
import Link from "next/link";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { loadNoticeDetail } from "../data";
import { AnnouncementDevEditor } from "./AnnouncementDevEditor";
import styles from "./page.module.css";

interface AnnouncementDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnnouncementDetailPage({ params, searchParams }: AnnouncementDetailPageProps) {
  const { slug } = await params;
  const { mode } = await searchParams;
  const notice = await loadNoticeDetail(slug);
  const isDevMode = process.env.NODE_ENV !== "production";
  const isEditMode = isDevMode && mode === "edit";

  if (!notice) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <DocsHeader title={notice.title} breadcrumb={["공지사항"]} />
      {isDevMode && !isEditMode ? (
        <div className={styles.devToolbar}>
          <Link href="/announcements/new" className={styles.devButton}>
            새 공지
          </Link>
          <Link href={isEditMode ? `/announcements/${slug}` : `/announcements/${slug}?mode=edit`} className={styles.devButton}>
            {isEditMode ? "보기 모드" : "수정 모드"}
          </Link>
        </div>
      ) : null}
      {isEditMode ? (
        <AnnouncementDevEditor
          slug={slug}
          initialTitle={notice.title}
          initialBlocks={notice.blocks}
        />
      ) : null}

      {!isEditMode ? (
      <section className={styles.content}>
        {notice.blocks.map((block) => (
          <DocsBlockViewer key={block.id} block={block} />
        ))}
      </section>
      ) : null}
    </div>
  );
}
