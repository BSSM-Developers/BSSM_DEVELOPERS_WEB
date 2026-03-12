import { SidebarNode } from "../ui/sidebarItem/types";

type Node = SidebarNode & { id: string };

export function findNodeById(list: Node[], id: string): Node | null {
  for (const n of list) {
    if (n.id === id) return n;
    if (n.childrenItems?.length) {
      const found = findNodeById(n.childrenItems as Node[], id);
      if (found) return found;
    }
  }
  return null;
}

export function findNodePathById(list: Node[], id: string): Node[] | null {
  for (const n of list) {
    if (n.id === id) {
      return [n];
    }
    if (n.childrenItems?.length) {
      const childPath = findNodePathById(n.childrenItems as Node[], id);
      if (childPath) {
        return [n, ...childPath];
      }
    }
  }
  return null;
}

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

export function applySiblings(list: Node[], parentId: string | null, newSiblings: Node[]): Node[] {
  if (parentId === null) {
    return newSiblings as SidebarNode[];
  }
  const walk = (xs: Node[]): Node[] =>
    xs.map(n =>
      n.id === parentId
        ? { ...n, childrenItems: newSiblings as SidebarNode[] }
        : { ...n, childrenItems: n.childrenItems ? (walk(n.childrenItems as Node[]) as SidebarNode[]) : undefined },
    );
  return walk(list);
}

export function updateNode(list: Node[], id: string, updates: Partial<Node>): Node[] {
  return list.map(node => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.childrenItems) {
      return { ...node, childrenItems: updateNode(node.childrenItems as Node[], id, updates) as SidebarNode[] };
    }
    return node;
  });
}
