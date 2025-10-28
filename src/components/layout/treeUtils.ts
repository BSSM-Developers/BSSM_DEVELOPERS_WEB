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

// 상위 노드인지 확인
export function isTopLevel(list: Node[], topLevelId: string, targetId: string): boolean {
  const walk = (xs: Node[], foundTopLevel: boolean): boolean => {
    for (const n of xs) {
      const nextFound = foundTopLevel || n.id === topLevelId;
      if (n.id === targetId && foundTopLevel) return true;
      if (n.childrenItems?.length && walk(n.childrenItems as Node[], nextFound)) return true;
    }
    return false;
  };
  return walk(list, false);
}

// id를 제거하고 제거된 노드를 반환
export function removeNodeWithReturn(list: Node[], id: string): { tree: Node[]; removed: Node | null } {
  let removed: Node | null = null;
  const walk = (xs: Node[]): Node[] =>
    xs.filter(n => {
      if (n.id === id) {
        removed = n;
          return false;
        }
        return true;
    })
  .map(n => ({
    ...n,
    childrenItems: n.childrenItems ? (walk(n.childrenItems as Node[]) as SidebarNode[]) : undefined,
  }));
  const tree = walk(list);

  return { tree, removed };
}