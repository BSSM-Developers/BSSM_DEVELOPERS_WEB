import { notFound } from "next/navigation";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import type { DocsBlock } from "@/types/docs";
import { loadNoticeDetail, loadNoticeSummaries } from "../data";
import styles from "./page.module.css";

interface AnnouncementDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const notices = await loadNoticeSummaries();
  return notices.map((notice) => ({ slug: notice.slug }));
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { slug } = await params;
  const notice = await loadNoticeDetail(slug);

  if (!notice) {
    notFound();
  }

  const blocks: DocsBlock[] = [
    { id: `${notice.id}-title`, module: "headline_1", content: notice.title },
    { id: `${notice.id}-summary`, module: "docs_1", content: notice.summary },
    { id: `${notice.id}-space`, module: "space" },
    ...notice.content.map((paragraph, index) => ({
      id: `${notice.id}-${index}`,
      module: "docs_1" as const,
      content: paragraph,
    })),
  ];

  return (
    <div className={styles.page}>
      <DocsHeader title={notice.title} breadcrumb={["공지사항"]} />

      <section className={styles.content}>
        {blocks.map((block) => (
          <DocsBlockViewer key={block.id} block={block} />
        ))}
      </section>
    </div>
  );
}
