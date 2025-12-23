export type DocsModule =
  | "docs_1"
  | "code"
  | "image"
  | "headline_1"
  | "headline_2"
  | "list"
  | "api"
  | "big_space";

export interface DocsBlock {
  module: DocsModule;
  content?: string;
  listItems?: string[];
  imageSrc?: string;
  apiData?: ApiDoc;
  language?: string;
}

export interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface ApiDoc {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  mappingEndpoint?: string;
  description: string;
  headerParams?: ApiParam[];
  pathParams?: ApiParam[];
  queryParams?: ApiParam[];
  bodyParams?: ApiParam[];
  responseParams?: ApiParam[];
  sampleCode?: string;
  responseCode?: string;
  responseData?: any;
  responseStatus?: number;
  responseMessage?: string;
}
