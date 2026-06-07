export type ModuleType = "default" | "api" | "main" | "collapse" | "small" | "main_title";

export interface SidebarNode {
  id: string;
  label: string;
  module?: string;
  path?: string;
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  endpoint?: string; // 파싱 엔드포인트에서 선택 시 채워짐 (API 블록 apiData.endpoint 초기값)
  childrenItems?: SidebarNode[];
}
