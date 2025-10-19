import type { sidebarModules } from "./modules";

export type ModuleType = keyof typeof sidebarModules;

export interface SidebarNode {
  label: string;
  module?: ModuleType;
  method?: "GET" | "POST" | "DELETE";
  childrenItems?: SidebarNode[];
}