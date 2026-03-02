import { notFound } from "next/navigation";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { loadGuideDetail, loadGuideSummaries } from "../data";
import styles from "./page.module.css";

interface GuideDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const guides = await loadGuideSummaries();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const guide = await loadGuideDetail(slug);

  if (!guide) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <DocsHeader title={guide.title} breadcrumb={["가이드"]} />
      <section className={styles.content}>
        {guide.blocks.map((block, index) => (
          <DocsBlockViewer key={block.id ?? `${guide.id}-${index}`} block={block} />
        ))}
      </section>
    </div>
  );
}
