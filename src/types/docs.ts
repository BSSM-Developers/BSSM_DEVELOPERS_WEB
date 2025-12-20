export type DocsModule =
  | "docs_1"
  | "code"
  | "image"
  | "headline_1"
  | "headline_2"
  | "list"
  | "api";

export interface DocsBlock {
  module: DocsModule;
  content?: string;
  listItems?: string[];
  imageSrc?: string;
  apiData?: ApiDoc;
}

export interface ApiDoc {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  mappingEndpoint?: string;
  description: string;
  headerParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  bodyParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  responseParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  sampleCode?: string;
  responseCode?: string;
}
