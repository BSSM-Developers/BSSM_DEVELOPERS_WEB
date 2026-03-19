import { notFound } from "next/navigation";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { AnnouncementDevEditor } from "../[slug]/AnnouncementDevEditor";
import styles from "../[slug]/page.module.css";
import type { DocsBlock } from "@/types/docs";

const initialBlocks: DocsBlock[] = [{ id: "new-notice-1", module: "docs_1", content: "" }];

export default function AnnouncementCreatePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className={styles.page}>
      <DocsHeader title="새 공지사항" breadcrumb={["공지사항"]} />
      <AnnouncementDevEditor mode="create" initialTitle="" initialBlocks={initialBlocks} />
    </div>
  );
}
