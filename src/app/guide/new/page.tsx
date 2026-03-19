import { notFound } from "next/navigation";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { GuideDevEditor } from "../[slug]/GuideDevEditor";
import styles from "../[slug]/page.module.css";
import type { DocsBlock } from "@/types/docs";

const initialBlocks: DocsBlock[] = [{ id: "new-guide-1", module: "docs_1", content: "" }];

export default function GuideCreatePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className={styles.page}>
      <DocsHeader title="새 가이드" breadcrumb={["가이드"]} />
      <GuideDevEditor mode="create" initialTitle="" initialBlocks={initialBlocks} />
    </div>
  );
}
