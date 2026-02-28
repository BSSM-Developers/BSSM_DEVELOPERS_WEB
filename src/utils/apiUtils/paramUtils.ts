import type { ApiDoc } from "@/types/docs";

export interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  example?: string;
  children?: ApiParam[];
}

export interface ParamGroup {
  headerParams: ApiParam[];
  cookieParams: ApiParam[];
  bodyParams: ApiParam[];
  queryParams: ApiParam[];
  pathParams: ApiParam[];
}

export function extractParams(apiDoc: ApiDoc): ParamGroup {
  const extractedPathParams = extractPathParams(apiDoc.endpoint);
  const definedPathParams = apiDoc.pathParams || [];

  const pathParams = extractedPathParams.map(ep => {
    const defined = definedPathParams.find(dp => dp.name === ep.name);
    return defined || ep;
  });

  return {
    headerParams: apiDoc.headerParams || [],
    cookieParams: apiDoc.cookieParams || [],
    bodyParams: apiDoc.bodyParams || [],
    queryParams: apiDoc.queryParams || [],
    pathParams: pathParams
  };
}

export function extractPathParams(endpoint: string): ApiParam[] {
  const pathParamRegex = /\{([^}]+)\}/g;
  const matches = endpoint.matchAll(pathParamRegex);

  return Array.from(matches).map(match => ({
    name: match[1],
    type: "string",
    description: `경로 파라미터: ${match[1]}`,
    required: true
  }));
}

export function paramsToObject(params: ApiParam[]): Record<string, string> {
  return params.reduce((acc, param) => {
    acc[param.name] = param.type;
    return acc;
  }, {} as Record<string, string>);
}

export function getRequiredParams(params: ApiParam[]): ApiParam[] {
  return params.filter(param => param.required);
}

export function getOptionalParams(params: ApiParam[]): ApiParam[] {
  return params.filter(param => !param.required);
}

export function groupParamsByType(params: ApiParam[]): Record<string, ApiParam[]> {
  return params.reduce((acc, param) => {
    const type = param.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(param);
    return acc;
  }, {} as Record<string, ApiParam[]>);
}

export function validateParam(param: ApiParam): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!param.name || param.name.trim() === '') {
    errors.push('파라미터 이름이 필요합니다');
  }

  if (!param.type || param.type.trim() === '') {
    errors.push('파라미터 타입이 필요합니다');
  }

  if (!param.description || param.description.trim() === '') {
    errors.push('파라미터 설명이 필요합니다');
  }

  const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (param.name && !namePattern.test(param.name)) {
    errors.push('파라미터 이름은 영문자로 시작하고 영문자, 숫자, 언더스코어만 포함할 수 있습니다');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateParams(params: ApiParam[]): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  params.forEach((param, index) => {
    const validation = validateParam(param);
    if (!validation.isValid) {
      errors[`param_${index}_${param.name || 'unnamed'}`] = validation.errors;
      isValid = false;
    }
  });

  const names = params.map(p => p.name).filter(Boolean);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length > 0) {
    errors['duplicate_names'] = [`중복된 파라미터 이름: ${duplicates.join(', ')}`];
    isValid = false;
  }

  return { isValid, errors };
}

export function generateParamExamples(params: ApiParam[]): Record<string, unknown> {
  const examples: Record<string, unknown> = {};

  params.forEach(param => {
    if (param.example !== undefined && param.example !== "") {
      if (param.type === 'number' || param.type === 'integer') {
        examples[param.name] = Number(param.example);
      } else if (param.type === 'boolean') {
        examples[param.name] = param.example === 'true';
      } else if (param.type === 'array') {
        try {
          examples[param.name] = JSON.parse(param.example);
        } catch {
          examples[param.name] = param.example;
        }
      } else if (param.type === 'object') {
        try {
          examples[param.name] = JSON.parse(param.example);
        } catch {
          examples[param.name] = param.example;
        }
      } else {
        examples[param.name] = param.example;
      }
    } else if (param.children && param.children.length > 0) {
      if (param.type === 'array') {
        examples[param.name] = [generateParamExamples(param.children)];
      } else {
        examples[param.name] = generateParamExamples(param.children);
      }
    } else {
      switch (param.type.toLowerCase()) {
        case 'string':
          examples[param.name] = param.name.includes('email') ? 'user@example.com'
            : param.name.includes('name') ? '사용자명'
              : param.name.includes('id') ? 'abc123'
                : `${param.name}_example`;
          break;
        case 'number':
        case 'integer':
          examples[param.name] = param.name.includes('age') ? 25
            : param.name.includes('count') ? 10
              : param.name.includes('id') ? 123
                : 42;
          break;
        case 'boolean':
          examples[param.name] = true;
          break;
        case 'array':
          examples[param.name] = ['item1', 'item2'];
          break;
        case 'object':
          examples[param.name] = {};
          break;
        case 'null':
          examples[param.name] = null;
          break;
        case 'any':
          examples[param.name] = 'any_value';
          break;
        default:
          examples[param.name] = `${param.type}_example`;
      }
    }
  });

  return examples;
}

export function paramsToJsonSchema(params: ApiParam[]): { type: string; properties: Record<string, unknown>; required: string[] } {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  params.forEach(param => {
    properties[param.name] = {
      type: param.type === 'integer' ? 'number' : param.type,
      description: param.description
    };

    if (param.required) {
      required.push(param.name);
    }
  });

  return {
    type: 'object',
    properties,
    required
  };
}