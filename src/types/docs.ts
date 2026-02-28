export type DocsModule =
  | "docs_1"
  | "code"
  | "image"
  | "headline_1"
  | "headline_2"
  | "list"
  | "api"
  | "big_space"
  | "space";

export interface DocsBlock {
  id?: string;
  module: DocsModule;
  content?: string;
  listItems?: string[];
  imageSrc?: string;
  imageWidth?: number | string;
  apiData?: ApiDoc;
  language?: string;
}

export interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  example?: string;
  children?: ApiParam[];
  paramLocation?: 'header' | 'cookie' | 'query' | 'path' | 'body';
}

export interface ApiDoc {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "UPDATE";
  endpoint: string;
  description: string;
  headerParams?: ApiParam[];
  cookieParams?: ApiParam[];
  pathParams?: ApiParam[];
  queryParams?: ApiParam[];
  bodyParams?: ApiParam[];
  responseParams?: ApiParam[];
  sampleCode?: string;
  responseCode?: string;
  responseData?: unknown;
  responseStatus?: number;
  responseMessage?: string;
  isVerified?: boolean;
}
