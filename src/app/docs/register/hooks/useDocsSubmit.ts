import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateOriginalDocsMutation } from "@/app/docs/queries";
import { docsApi } from "@/app/docs/api";
import { DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { FormData } from "./useDocsForm";

export const useDocsSubmit = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const createOriginalMutation = useCreateOriginalDocsMutation();

  const handleSubmit = async (
    formData: FormData,
    sidebarItems: SidebarNode[],
    contentMap: Record<string, DocsBlock[]>,
    currentDocsBlocks: DocsBlock[]
  ) => {
    try {
      setLoading(true);

      const payload = {
        ...formData,
        sidebar: {
          title: formData.title,
          sideBarBlocks: sidebarItems
        },
        docsPage: []
      };

      interface CreateDocsResponse {
        data?: { id: string };
        id?: string;
        docsId?: string;
      }

      const response = await createOriginalMutation.mutateAsync(payload) as unknown as CreateDocsResponse;
      let newDocId = response?.data?.id || response?.id || response?.docsId;

      if (!newDocId) {
        try {
          const listResponse = await docsApi.getList();
          const list = (listResponse as any).values || (Array.isArray(listResponse) ? listResponse : []);

          if (Array.isArray(list)) {
            const found = list.find((d: { title: string, docsId?: string, id?: string }) => d.title === formData.title);
            if (found) {
              newDocId = found.docsId || found.id;
            }
          }
        } catch {
          // Fallback failed silently
        }
      }

      if (newDocId) {
        try {
          const mainContent = contentMap['draft-doc'] || currentDocsBlocks;
          if (mainContent.length > 0) {
            await docsApi.updatePage(newDocId, newDocId, mainContent);
          }
        } catch {
          // Content update failed silently
        }

        router.push(`/docs/${newDocId}/edit`);
      } else {
        alert("문서가 생성되었으나 ID를 확인할 수 없습니다. 목록으로 이동합니다.");
        router.push('/docs');
      }

    } catch {
      alert("문서 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmit
  };
};
