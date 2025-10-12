export interface DocsBlock {
  module: string;
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
