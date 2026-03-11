import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCustomDocsMutation, useCreateOriginalDocsMutation } from "@/app/docs/queries";
import { DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { FormData } from "./useDocsForm";
import { useUserStore } from "@/store/userStore";

interface SidebarBlock {
  id: string;
  mappedId?: string;
  label: string;
  module: "main_title" | "api" | "default" | "collapse";
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  childrenItems?: SidebarBlock[];
}

interface DocsPageBlock {
  id?: string;
  module: string;
  content?: string;
}

interface DocsPage {
  id: string;
  endpoint?: string;
  blocks: DocsPageBlock[];
}

function flattenNodes(nodes: SidebarNode[]): SidebarNode[] {
  const result: SidebarNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.childrenItems && node.childrenItems.length > 0) {
      result.push(...flattenNodes(node.childrenItems));
    }
  }
  return result;
}

function toSidebarBlock(node: SidebarNode): SidebarBlock {
  const block: SidebarBlock = {
    id: node.id,
    label: node.label,
    module: (node.module === "main" ? "main_title" : node.module) as SidebarBlock["module"],
  };
  if (node.method) block.method = node.method as SidebarBlock["method"];
  if (node.childrenItems && node.childrenItems.length > 0) {
    block.childrenItems = node.childrenItems.map(toSidebarBlock);
  }
  return block;
}


function toPageBlocks(blocks: DocsBlock[]): DocsPageBlock[] {
  const result: DocsPageBlock[] = [];
  for (const b of blocks) {
    if (b.module === 'api' && b.apiData) {
      result.push({
        id: b.id,
        module: 'api',
        content: JSON.stringify(b.apiData)
      });
    } else {
      result.push({
        id: b.id,
        module: b.module,
        ...(b.content !== undefined ? { content: b.content } : {}),
      });
    }
  }
  return result;
}

export const useDocsSubmit = (confirm: (options: { title: string; message: string; hideCancel?: boolean }) => Promise<boolean>) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const createOriginalMutation = useCreateOriginalDocsMutation();
  const createCustomMutation = useCreateCustomDocsMutation();
  const user = useUserStore((state) => state.user);

  const handleSubmit = async (
    formData: FormData,
    sidebarItems: SidebarNode[],
    contentMap: Record<string, DocsBlock[]>,
    currentDocsBlocks: DocsBlock[],
    selectedId: string
  ): Promise<void> => {
    try {
      setLoading(true);

      if (!user) {
        const go = await confirm({
          title: "권한 오류",
          message: "로그인 정보가 없습니다. 다시 로그인하시겠습니까?",
          hideCancel: false
        });
        if (go) {
          router.push("/login");
        }
        return;
      }

      const allNodes = flattenNodes(sidebarItems);
      const docs_pages: DocsPage[] = allNodes.map((node) => {
        const blocks = contentMap[node.id] ?? (node.id === selectedId ? currentDocsBlocks : []);
        const apiData = blocks.find((b) => b.module === 'api')?.apiData;
        const page: DocsPage = {
          id: node.id,
          blocks: toPageBlocks(blocks),
        };
        if (apiData?.endpoint) page.endpoint = apiData.endpoint;
        return page;
      });

      const payload = {
        title: formData.title,
        description: formData.description,
        domain: formData.domain,
        repository_url: formData.repository_url,
        auto_approval: formData.auto_approval,
        writer_id: user.id,
        sidebar: {
          blocks: sidebarItems.map(toSidebarBlock),
        },
        docs_pages,
      };

      await createOriginalMutation.mutateAsync(payload);

      await confirm({
        title: "등록 완료",
        message: "문서가 성공적으로 등록되었습니다. 홈으로 이동합니다.",
        hideCancel: true
      });
      router.push('/');

    } catch (error) {
      console.error(error);
      await confirm({
        title: "등록 실패",
        message: "문서 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCustom = async (formData: FormData): Promise<void> => {
    try {
      setLoading(true);
      await createCustomMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        writer_id: user?.id,
      });

      await confirm({
        title: "생성 완료",
        message: "커스텀 문서가 생성되었습니다.",
        hideCancel: true,
      });
      router.push("/user");
    } catch (error) {
      console.error(error);
      await confirm({
        title: "생성 실패",
        message: "커스텀 문서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmit,
    handleSubmitCustom,
  };
};
