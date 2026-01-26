/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { docsApi } from "@/app/docs/api";
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

        // getDetail 먼저 시도
        try {
          const response = await docsApi.getDetail(slug);
          setDocData(response);
          return;
        } catch (e) {
          // detail 실패 시 list로 대체
        }

        // getList로 대체
        const listResponse: any = await docsApi.getList();

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
        // 모의 데이터 (Fallback)
        const mockDoc = {
          title: "예시 문서 (서버 연결 실패)",
          contents: [
            { module: "headline_1", content: "BSSM Developers API" },
            { module: "docs_1", content: "현재 백엔드 서버와 연결할 수 없어 예시 데이터를 표시합니다." },
            { module: "headline_2", content: "시작하기" },
            { module: "docs_1", content: "이 API는 BSSM 개발자들을 위한 다양한 기능을 제공합니다." },
            { module: "code", content: "console.log('Hello, BSSM Developers!');", language: "javascript" },
            {
              module: "api",
              apiData: {
                id: "mock-api-1",
                name: "사용자 조회",
                method: "GET",
                endpoint: "/api/v1/users/{id}",
                description: "사용자 ID로 사용자 정보를 조회합니다.",
                pathParams: [{ name: "id", type: "string", description: "사용자 ID", required: true }],
                responseStatus: 200,
                responseMessage: "OK"
              }
            }
          ]
        };
        setDocData({ data: mockDoc });
        // setError(error.message || "Failed to fetch document"); // 모의 데이터를 보여주기 위해 에러 상태 비활성화
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
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Loading...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>
        Error: {error}
      </div>
    );
  }

  if (!docData) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Document not found.</div>
    );
  }

  // 응답 구조 처리 (response.data가 문서라고 가정)
  const doc = docData.data || docData;
  const title = doc.title || "Untitled";
  // 내용이 없으면 빈 배열로 대체
  const blocks: DocsBlockType[] = doc.contents || [];

  return (
    <>
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
    </>
  );
}
