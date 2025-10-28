import { SidebarNode } from "../ui/sidebarItem/types";

type Node = SidebarNode & { id: string };

// 부모 id 찾기
export function findParentId(list: Node[], childId: string, parentId: string | null = null): string | null {
  for (const n of list) {
    if (n.id === childId) return parentId;
    if (n.childrenItems?.length) {
      const found = findParentId(n.childrenItems as Node[], childId, n.id);
      if (found !== null) return found;
    }
  }
  return null;
}