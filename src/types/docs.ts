export interface DocsBlock {
  type: "heading" | "paragraph" | "code" | "list" | "api";
  content?: string;
  language?: string;
  listItems?: string[];
  apiData?: ApiDoc;
}

export interface ApiDoc {
  method: string;
  endpoint: string;
  request: {
    headers?: Record<string, string>;
    body?: Record<string, string>;
  };
  response: {
    status_code: number;
    body: Record<string, string>;
  };
}