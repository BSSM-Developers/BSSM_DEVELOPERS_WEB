export type ModuleType = "default" | "api" | "main" | "collapse" | "small";

export interface SidebarNode {
  id: string;
  label: string;
  module?: ModuleType;
  method?: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  childrenItems?: SidebarNode[];
}