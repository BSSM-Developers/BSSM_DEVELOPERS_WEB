"use client";

import { useEffect, useState } from "react";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { api } from "@/lib/api";
import { DocsBlock as DocsBlockType } from "@/types/docs";
import { useParams } from "next/navigation";

export default function DocsViewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [docData, setDocData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setIsLoading(true);

        // Try getDetail first
        try {
          const response = await api.docs.getDetail(slug);
          setDocData(response);
          return;
        } catch (e) {
          // Fallback to list if detail fails
        }

        // Fallback to getList
        const listResponse: any = await api.docs.getList();

        if (listResponse && listResponse.data && Array.isArray(listResponse.data.values)) {
          const found = listResponse.data.values.find((d: any) => d.docsId === slug || d.id === slug);
          if (found) {
            setDocData({ data: found });
          } else {
            throw new Error("Document not found");
          }
        } else {
          throw new Error("Invalid list response");
        }
      } catch (error: any) {
        console.error("Failed to fetch doc:", error);
        setError(error.message || "Failed to fetch document");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchDoc();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <DocsLayout>
        <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Loading...</div>
      </DocsLayout>
    );
  }

  if (error) {
    return (
      <DocsLayout>
        <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>
          Error: {error}
        </div>
      </DocsLayout>
    );
  }

  if (!docData) {
    return (
      <DocsLayout>
        <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Document not found.</div>
      </DocsLayout>
    );
  }

  // Handle response structure (assuming response.data is the doc)
  const doc = docData.data || docData;
  const title = doc.title || "Untitled";
  // Fallback to empty array if contents is missing
  const blocks: DocsBlockType[] = doc.contents || [];

  return (
    <DocsLayout>
      <DocsHeader title={title} breadcrumb={["API", title]} isApi={false} />
      <div style={{ minHeight: "500px", paddingBottom: "100px" }}>
        {blocks.length > 0 ? (
          blocks.map((block, i) => (
            <DocsBlockViewer key={i} block={block} />
          ))
        ) : (
          <div style={{ padding: "20px 0", color: "#9CA3AF" }}>
            내용이 없습니다.
          </div>
        )}
      </div>
    </DocsLayout>
  );
}
