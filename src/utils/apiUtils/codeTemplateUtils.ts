import type { ApiDoc } from "@/types/docs";
import type { ApiParam } from "./paramUtils";
import { generateParamExamples, extractParams } from "./paramUtils";

export type Language = 'javascript' | 'python' | 'shell';
export type Library = 'axios' | 'fetch' | 'jquery' | 'requests' | 'native';

export interface CodeTemplateOptions {
  language: Language;
  library?: Library;
  baseUrl?: string;
  includeAuth?: boolean;
  authType?: 'bearer' | 'basic' | 'apikey';
  authHeaderName?: string;
  formatCode?: boolean;
}

/**
 * API 정보에서 요청 코드를 생성
 */
export function generateRequestCode(apiDoc: ApiDoc, options: CodeTemplateOptions): string {
  const { language, library = 'axios', baseUrl = '', includeAuth = true } = options;

  const params = extractParams(apiDoc);
  const examples = {
    header: generateParamExamples(params.headerParams),
    body: generateParamExamples(params.bodyParams),
    query: generateParamExamples(params.queryParams),
    path: generateParamExamples(params.pathParams)
  };

  const endpoint = replacePathParams(apiDoc.endpoint, examples.path);
  const fullUrl = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

  switch (language) {
    case 'javascript':
      return generateJavaScriptCode(apiDoc, fullUrl, examples, library, options);
    case 'python':
      return generatePythonCode(apiDoc, fullUrl, examples, library, options);
    case 'shell':
      return generateShellCode(apiDoc, fullUrl, examples, options);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * 경로 파라미터를 실제 값으로 치환
 */
function replacePathParams(endpoint: string, pathParams: Record<string, any>): string {
  let result = endpoint;
  Object.entries(pathParams).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  return result;
}

/**
 * 인증 헤더 생성
 */
function generateAuthHeader(options: CodeTemplateOptions): Record<string, string> {
  if (!options.includeAuth) return {};

  const { authType = 'bearer', authHeaderName = 'Authorization' } = options;

  switch (authType) {
    case 'bearer':
      return { [authHeaderName]: 'Bearer YOUR_TOKEN_HERE' };
    case 'basic':
      return { [authHeaderName]: 'Basic YOUR_CREDENTIALS_HERE' };
    case 'apikey':
      return { [authHeaderName]: 'YOUR_API_KEY_HERE' };
    default:
      return {};
  }
}

/**
 * JavaScript/TypeScript 코드 생성
 */
function generateJavaScriptCode(
  apiDoc: ApiDoc,
  url: string,
  examples: any,
  library: Library,
  options: CodeTemplateOptions
): string {
  const authHeaders = generateAuthHeader(options);
  const headers = { ...authHeaders, ...examples.header };
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(apiDoc.method);

  switch (library) {
    case 'axios':
      return `<span style="color: #ff7b72">const</span> axios = <span style="color: #ffa656">require</span>(<span style="color: #9fcef8">'axios'</span>);

<span style="color: #ff7b72">const</span> response = <span style="color: #ff7b72">await</span> <span style="color: #cda3f9">axios</span>({
  <span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'${apiDoc.method.toLowerCase()}'</span>,
  <span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'${url}'</span>,${Object.keys(headers).length > 0 ? `
  <span style="color: #9fcef8">headers</span>: ${JSON.stringify(headers, null, 2).replace(/"/g, '<span style="color: #9fcef8">\\"</span>')},` : ''}${hasBody && Object.keys(examples.body).length > 0 ? `
  <span style="color: #9fcef8">data</span>: ${JSON.stringify(examples.body, null, 2).replace(/"/g, '<span style="color: #9fcef8">\\"</span>')},` : ''}
});

<span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(response.data);`;

    case 'fetch':
      const fetchOptions: string[] = [`<span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'${apiDoc.method}'</span>`];

      if (Object.keys(headers).length > 0) {
        fetchOptions.push(`<span style="color: #9fcef8">headers</span>: ${JSON.stringify(headers, null, 2).replace(/"/g, '<span style="color: #9fcef8">\\"</span>')}`);
      }

      if (hasBody && Object.keys(examples.body).length > 0) {
        fetchOptions.push(`<span style="color: #9fcef8">body</span>: <span style="color: #cda3f9">JSON.stringify</span>(${JSON.stringify(examples.body, null, 2).replace(/"/g, '<span style="color: #9fcef8">\\"</span>')})`);
      }

      return `<span style="color: #ff7b72">const</span> response = <span style="color: #ff7b72">await</span> <span style="color: #cda3f9">fetch</span>(<span style="color: #9fcef8">'${url}'</span>, {
  ${fetchOptions.join(',\n  ')}
});

<span style="color: #ff7b72">const</span> data = <span style="color: #ff7b72">await</span> response.<span style="color: #cda3f9">json</span>();
<span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(data);`;

    case 'jquery':
      const jqueryOptions: string[] = [
        `<span style="color: #9fcef8">url</span>: <span style="color: #9fcef8">'${url}'</span>`,
        `<span style="color: #9fcef8">method</span>: <span style="color: #9fcef8">'${apiDoc.method}'</span>`
      ];

      if (Object.keys(headers).length > 0) {
        jqueryOptions.push(`<span style="color: #9fcef8">headers</span>: ${JSON.stringify(headers, null, 2).replace(/"/g, '<span style="color: #9fcef8">\\"</span>')}`);
      }

      if (hasBody && Object.keys(examples.body).length > 0) {
        jqueryOptions.push(`<span style="color: #9fcef8">contentType</span>: <span style="color: #9fcef8">'application/json'</span>`);
        jqueryOptions.push(`<span style="color: #9fcef8">data</span>: <span style="color: #cda3f9">JSON.stringify</span>(${JSON.stringify(examples.body, null, 2).replace(/"/g, '<span style="color: #9fcef8">\\"</span>')})`);
      }

      return `<span style="color: #cda3f9">$</span>.<span style="color: #cda3f9">ajax</span>({
  ${jqueryOptions.join(',\n  ')}
}).<span style="color: #cda3f9">done</span>(<span style="color: #ff7b72">function</span>(response) {
  <span style="color: #ff7b72">console</span>.<span style="color: #cda3f9">log</span>(response);
});`;

    default:
      return generateJavaScriptCode(apiDoc, url, examples, 'axios', options);
  }
}

/**
 * Python 코드 생성
 */
function generatePythonCode(
  apiDoc: ApiDoc,
  url: string,
  examples: any,
  _library: Library,
  options: CodeTemplateOptions
): string {
  const authHeaders = generateAuthHeader(options);
  const headers = { ...authHeaders, ...examples.header };
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(apiDoc.method);

  return `import requests

${Object.keys(headers).length > 0 ? `headers = ${JSON.stringify(headers, null, 2)}` : ''}
${hasBody && Object.keys(examples.body).length > 0 ? `data = ${JSON.stringify(examples.body, null, 2)}` : ''}

response = requests.${apiDoc.method.toLowerCase()}('${url}'${Object.keys(headers).length > 0 ? ', headers=headers' : ''}${hasBody && Object.keys(examples.body).length > 0 ? ', json=data' : ''})

print(response.json())`;
}

/**
 * 응답 코드 템플릿 생성
 */
export function generateResponseTemplate(
  statusCode: number = 200,
  message: string = "성공",
  data: any = null
): string {
  const responseObj = {
    status: statusCode,
    message,
    data
  };

  return JSON.stringify(responseObj, null, 2)
    .replace(/"([^"]+)":/g, '<span style="color: #9fcef8">"$1"</span><span style="color: #d1d6db">:</span>')
    .replace(/: "([^"]+)"/g, ': <span style="color: #9fcef8">"$1"</span>')
    .replace(/: (\d+)/g, ': <span style="color: #9fcef8">$1</span>')
    .replace(/: (true|false|null)/g, ': <span style="color: #ff7b72">$1</span>')
    .replace(/,/g, '<span style="color: #d1d6db">,</span>');
}

/**
 * Shell/cURL 코드 생성
 */
function generateShellCode(
  apiDoc: ApiDoc,
  url: string,
  examples: any,
  options: CodeTemplateOptions
): string {
  const authHeaders = generateAuthHeader(options);
  const headers = { ...authHeaders, ...examples.header };
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(apiDoc.method);

  const curlParts = [`curl -X ${apiDoc.method}`];

  Object.entries(headers).forEach(([key, value]) => {
    curlParts.push(`  -H "${key}: ${value}"`);
  });

  if (hasBody && Object.keys(examples.body).length > 0) {
    curlParts.push(`  -H "Content-Type: application/json"`);
    curlParts.push(`  -d '${JSON.stringify(examples.body)}'`);
  }

  curlParts.push(`  "${url}"`);

  return curlParts.join(' \\\n');
}

/**
 * 라이브러리별 지원 언어 매핑
 */
export const libraryLanguageMap: Record<Library, Language[]> = {
  axios: ['javascript'],
  fetch: ['javascript'],
  jquery: ['javascript'],
  requests: ['python'],
  native: ['shell']
};

/**
 * 언어별 기본 라이브러리
 */
export const defaultLibraryMap: Record<Language, Library> = {
  javascript: 'axios',
  python: 'requests',
  shell: 'native'
};