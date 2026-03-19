"use client";

import { useMemo } from "react";
import { findNodePathById } from "@/components/layout/treeUtils";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { SidebarModuleOption } from "@/components/layout/DocsSidebar";
import { collectPageTargetsFromSidebar } from "../helpers";

type UseDocsEditViewModelParams = {
  sidebarItems: SidebarNode[];
  selectedId: string | null;
  effectiveProjectTitle: string;
  isCustomDocs: boolean;
};

const CUSTOM_SIDEBAR_MODULE_OPTIONS: SidebarModuleOption[] = [
  { label: "문서", module: "default" },
  { label: "그룹", module: "collapse" },
  { label: "API", module: "api" },
];

export function useDocsEditViewModel({
  sidebarItems,
  selectedId,
  effectiveProjectTitle,
  isCustomDocs,
}: UseDocsEditViewModelParams) {
  const pageTargets = useMemo(() => collectPageTargetsFromSidebar(sidebarItems), [sidebarItems]);

  const selectedPathLabels = useMemo(() => {
    if (!selectedId) {
      return [];
    }
    return findNodePathById(sidebarItems, selectedId)?.map((node) => node.label).filter((label) => Boolean(label)) ?? [];
  }, [selectedId, sidebarItems]);

  const currentLabel = useMemo(() => {
    if (selectedPathLabels.length > 0) {
      return selectedPathLabels[selectedPathLabels.length - 1];
    }
    if (!selectedId) {
      return "문서 수정";
    }
    return pageTargets.find((target) => target.mappedId === selectedId)?.label || "문서 수정";
  }, [pageTargets, selectedId, selectedPathLabels]);

  const breadcrumbPath = useMemo(() => {
    if (selectedPathLabels.length > 1) {
      return selectedPathLabels.slice(0, -1);
    }
    return [sidebarItems[0]?.label || effectiveProjectTitle || "문서"];
  }, [effectiveProjectTitle, selectedPathLabels, sidebarItems]);

  const selectedTarget = useMemo(
    () => pageTargets.find((target) => target.mappedId === selectedId),
    [pageTargets, selectedId]
  );

  const isReadonlyImportedApi = Boolean(isCustomDocs && selectedTarget?.module === "api");

  return {
    pageTargets,
    currentLabel,
    breadcrumbPath,
    isReadonlyImportedApi,
    customSidebarModuleOptions: CUSTOM_SIDEBAR_MODULE_OPTIONS,
  };
}
