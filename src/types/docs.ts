export type DocsModule =
  | "docs_1"
  | "code"
  | "image"
  | "headline_1"
  | "headline_2"
  | "list";

export interface DocsBlock {
  module: DocsModule;
  content?: string;
  listItems?: string[];
  imageSrc?: string;
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
