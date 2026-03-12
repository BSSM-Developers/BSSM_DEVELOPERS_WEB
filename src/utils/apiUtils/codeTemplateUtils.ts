import type { ApiDoc, ApiParam } from "@/types/docs";
import { generateParamExamples, extractParams } from "./paramUtils";

import { wrapColor, highlightJson } from "./highlightUtils";

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

export function generateRequestCode(apiDoc: ApiDoc, options: CodeTemplateOptions): string {
  const { language, library = 'axios', baseUrl = '' } = options;

  const params = extractParams(apiDoc);
  const examples = {
    header: generateParamExamples(params.headerParams),
    cookie: generateParamExamples(params.cookieParams),
    body: generateParamExamples(params.bodyParams),
    query: generateParamExamples(params.queryParams),
    path: generateParamExamples(params.pathParams)
  };

  if (Object.keys(examples.cookie).length > 0) {
    const cookieString = Object.entries(examples.cookie)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    examples.header['Cookie'] = cookieString;
  }

  const endpoint = replacePathParams(apiDoc.endpoint, examples.path as Record<string, string>);
  let fullUrl = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

  if (Object.keys(examples.query).length > 0) {
    const queryString = new URLSearchParams(examples.query as Record<string, string>).toString();
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
  }

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

function replacePathParams(endpoint: string, pathParams: Record<string, string>): string {
  let result = endpoint;
  Object.entries(pathParams).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  return result;
}

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

function generateJavaScriptCode(
  apiDoc: ApiDoc,
  url: string,
  examples: { header: Record<string, unknown>; body: Record<string, unknown>; query: Record<string, unknown>; path: Record<string, unknown> },
  library: Library,
  options: CodeTemplateOptions
): string {
  const authHeaders = generateAuthHeader(options);
  const headers = { ...authHeaders, ...examples.header };
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(apiDoc.method);

  switch (library) {
    case 'axios':
      return `${wrapColor('const', 'keyword')} axios = ${wrapColor('require', 'special')}(${wrapColor("'axios'", 'string')});

${wrapColor('const', 'keyword')} response = ${wrapColor('await', 'keyword')} ${wrapColor('axios', 'function')}({
  ${wrapColor('method', 'key')}: ${wrapColor(`'${apiDoc.method.toLowerCase()}'`, 'string')},
  ${wrapColor('url', 'key')}: ${wrapColor(`'${url}'`, 'string')},${Object.keys(headers).length > 0 ? `
  ${wrapColor('headers', 'key')}: ${highlightJson(JSON.stringify(headers, null, 2))},` : ''}${hasBody && Object.keys(examples.body).length > 0 ? `
  ${wrapColor('data', 'key')}: ${highlightJson(JSON.stringify(examples.body, null, 2))},` : ''}
});

${wrapColor('console', 'keyword')}.${wrapColor('log', 'function')}(response.data);`;

    case 'fetch':
      const fetchOptions: string[] = [`${wrapColor('method', 'key')}: ${wrapColor(`'${apiDoc.method}'`, 'string')}`];

      if (Object.keys(headers).length > 0) {
        fetchOptions.push(`${wrapColor('headers', 'key')}: ${highlightJson(JSON.stringify(headers, null, 2))}`);
      }

      if (hasBody && Object.keys(examples.body).length > 0) {
        fetchOptions.push(`${wrapColor('body', 'key')}: ${wrapColor('JSON.stringify', 'function')}(${highlightJson(JSON.stringify(examples.body, null, 2))})`);
      }

      return `${wrapColor('const', 'keyword')} response = ${wrapColor('await', 'keyword')} ${wrapColor('fetch', 'function')}(${wrapColor(`'${url}'`, 'string')}, {
  ${fetchOptions.join(',\n  ')}
});

${wrapColor('const', 'keyword')} data = ${wrapColor('await', 'keyword')} response.${wrapColor('json', 'function')}();
${wrapColor('console', 'keyword')}.${wrapColor('log', 'function')}(data);`;

    case 'jquery':
      const jqueryOptions: string[] = [
        `${wrapColor('url', 'key')}: ${wrapColor(`'${url}'`, 'string')}`,
        `${wrapColor('method', 'key')}: ${wrapColor(`'${apiDoc.method}'`, 'string')}`
      ];

      if (Object.keys(headers).length > 0) {
        jqueryOptions.push(`${wrapColor('headers', 'key')}: ${highlightJson(JSON.stringify(headers, null, 2))}`);
      }

      if (hasBody && Object.keys(examples.body).length > 0) {
        jqueryOptions.push(`${wrapColor('contentType', 'key')}: ${wrapColor("'application/json'", 'string')}`);
        jqueryOptions.push(`${wrapColor('data', 'key')}: ${wrapColor('JSON.stringify', 'function')}(${highlightJson(JSON.stringify(examples.body, null, 2))})`);
      }

      return `${wrapColor('$', 'function')}.${wrapColor('ajax', 'function')}({
  ${jqueryOptions.join(',\n  ')}
}).${wrapColor('done', 'function')}(${wrapColor('function', 'keyword')}(response) {
  ${wrapColor('console', 'keyword')}.${wrapColor('log', 'function')}(response);
});`;

    default:
      return generateJavaScriptCode(apiDoc, url, examples, 'axios', options);
  }
}

function generatePythonCode(
  apiDoc: ApiDoc,
  url: string,
  examples: { header: Record<string, unknown>; body: Record<string, unknown>; query: Record<string, unknown>; path: Record<string, unknown> },
  _library: Library,
  options: CodeTemplateOptions
): string {
  const authHeaders = generateAuthHeader(options);
  const headers = { ...authHeaders, ...examples.header };
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(apiDoc.method);

  return `${wrapColor('import', 'keyword')} ${wrapColor('requests', 'function')}

${Object.keys(headers).length > 0 ? `${wrapColor('headers', 'variable')} = ${highlightJson(JSON.stringify(headers, null, 2))}` : ''}
${hasBody && Object.keys(examples.body).length > 0 ? `${wrapColor('data', 'variable')} = ${highlightJson(JSON.stringify(examples.body, null, 2))}` : ''}

${wrapColor('response', 'variable')} = ${wrapColor('requests', 'function')}.${wrapColor(apiDoc.method.toLowerCase(), 'function')}(${wrapColor(`'${url}'`, 'string')}${Object.keys(headers).length > 0 ? `, ${wrapColor('headers', 'key')}=${wrapColor('headers', 'variable')}` : ''}${hasBody && Object.keys(examples.body).length > 0 ? `, ${wrapColor('json', 'key')}=${wrapColor('data', 'variable')}` : ''})

${wrapColor('print', 'keyword')}(${wrapColor('response', 'variable')}.${wrapColor('json', 'function')}())`;
}

export function paramsToObject(params: ApiParam[]): Record<string, unknown> {
  return generateParamExamples(params);
}

export function generateResponseTemplate(
  statusCode: number = 200,
  message: string = "성공",
  responseParams?: ApiParam[]
): string {
  const data = responseParams && responseParams.length > 0
    ? paramsToObject(responseParams)
    : null;

  const responseObj = {
    status: statusCode,
    message,
    data
  };

  return highlightJson(JSON.stringify(responseObj, null, 2));
}

function generateShellCode(
  apiDoc: ApiDoc,
  url: string,
  examples: { header: Record<string, unknown>; body: Record<string, unknown>; query: Record<string, unknown>; path: Record<string, unknown> },
  options: CodeTemplateOptions
): string {
  const authHeaders = generateAuthHeader(options);
  const headers = { ...authHeaders, ...examples.header };
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(apiDoc.method);

  const curlParts = [`${wrapColor('curl', 'function')} ${wrapColor('-X', 'keyword')} ${wrapColor(apiDoc.method, 'string')}`];

  Object.entries(headers).forEach(([key, value]) => {
    curlParts.push(`  ${wrapColor('-H', 'keyword')} ${wrapColor(`"${key}: ${value}"`, 'string')}`);
  });

  if (hasBody && Object.keys(examples.body).length > 0) {
    const bodyJson = JSON.stringify(examples.body, null, 2);
    const indentedBody = bodyJson
      .split('\n')
      .map((line, i) => (i === 0 ? line : `  ${line}`))
      .join('\n');
    curlParts.push(`  ${wrapColor('-H', 'keyword')} ${wrapColor('"Content-Type: application/json"', 'string')}`);
    curlParts.push(`  ${wrapColor('-d', 'keyword')} ${wrapColor(`'${indentedBody.replace(/'/g, "\\'")}'`, 'string')}`);
  }

  curlParts.push(`  ${wrapColor(`"${url}"`, 'string')}`);

  return curlParts.join(' \\\n');
}

export const libraryLanguageMap: Record<Library, Language[]> = {
  axios: ['javascript'],
  fetch: ['javascript'],
  jquery: ['javascript'],
  requests: ['python'],
  native: ['shell']
};

export const defaultLibraryMap: Record<Language, Library> = {
  javascript: 'axios',
  python: 'requests',
  shell: 'native'
};
