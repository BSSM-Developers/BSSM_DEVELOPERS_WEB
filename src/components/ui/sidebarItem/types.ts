export type ModuleType = "default" | "api" | "main" | "collapse" | "small" | "main_title";

export interface SidebarNode {
  id: string;
  label: string;
  module?: string;
  path?: string;
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "UPDATE";
  childrenItems?: SidebarNode[];
}