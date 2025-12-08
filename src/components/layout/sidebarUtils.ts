import type { SidebarNode } from "@/components/ui/sidebarItem/types";

export const insertAfter = (list: SidebarNode[], targetId: string, node: Omit<SidebarNode,"id">): SidebarNode[] => {
  const id = crypto.randomUUID();
  const walk = (xs: SidebarNode[]): SidebarNode[] => {
    const i = xs.findIndex(x => x.id === targetId);
    if (i >= 0) {
      const copy = [...xs];
      copy.splice(i + 1, 0, { id, ...node });
      return copy;
    }
    return xs.map(x => ({
      ...x,
      childrenItems: x.childrenItems ? walk(x.childrenItems) : undefined,
    }));
  };
  return walk(list);
};

export const appendChild = (list: SidebarNode[], parentId: string, node: Omit<SidebarNode,"id">): SidebarNode[] => {
  const id = crypto.randomUUID();
  const walk = (xs: SidebarNode[]): SidebarNode[] =>
    xs.map(x =>
      x.id === parentId
        ? { ...x, childrenItems: [ ...(x.childrenItems ?? []), { id, ...node } ] }
        : { ...x, childrenItems: x.childrenItems ? walk(x.childrenItems) : undefined }
    );
  return walk(list);
};

export const renameNode = (list: SidebarNode[], id: string, label: string): SidebarNode[] =>
  list.map(x =>
    x.id === id
      ? { ...x, label }
      : { ...x, childrenItems: x.childrenItems ? renameNode(x.childrenItems, id, label) : undefined }
);

export const removeNode = (list: SidebarNode[], id: string): SidebarNode[] =>
  list
    .filter(x => x.id !== id)
    .map(x => ({ ...x, childrenItems: x.childrenItems ? removeNode(x.childrenItems, id) : undefined }));

export type Mutators = {
  addSibling: (targetId: string, node: Omit<SidebarNode,"id">) => void;
  addChild: (parentId: string, node: Omit<SidebarNode,"id">) => void;
  rename: (id: string, label: string) => void;
  remove: (id: string) => void;
};

export const createMutators = (
  effectiveItems: SidebarNode[],
  onChange?: (items: SidebarNode[]) => void,
  setLocalItems?: (items: SidebarNode[]) => void
): Mutators => ({
  addSibling: (targetId: string, node: Omit<SidebarNode,"id">) =>
    (onChange || setLocalItems)!(insertAfter(effectiveItems, targetId, node)),
  addChild: (parentId: string, node: Omit<SidebarNode,"id">) =>
    (onChange || setLocalItems)!(appendChild(effectiveItems, parentId, node)),
  rename: (id: string, label: string) =>
    (onChange || setLocalItems)!(renameNode(effectiveItems, id, label)),
  remove: (id: string) =>
    (onChange || setLocalItems)!(removeNode(effectiveItems, id)),
});