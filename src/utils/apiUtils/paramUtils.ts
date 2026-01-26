
import type { ApiDoc } from "@/types/docs";

export interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface ParamGroup {
  headerParams: ApiParam[];
  bodyParams: ApiParam[];
  queryParams: ApiParam[];
  pathParams: ApiParam[];
}

/**
 * ApiDoc에서 파라미터들을 추출하여 정리된 형태로 반환
 */
export function extractParams(apiDoc: ApiDoc): ParamGroup {
  const extractedPathParams = extractPathParams(apiDoc.endpoint);
  const definedPathParams = apiDoc.pathParams || [];

  // Merge: use defined ones if they exist, otherwise use extracted ones
  const pathParams = extractedPathParams.map(ep => {
    const defined = definedPathParams.find(dp => dp.name === ep.name);
    return defined || ep;
  });

  return {
    headerParams: apiDoc.headerParams || [],
    bodyParams: apiDoc.bodyParams || [],
    queryParams: apiDoc.queryParams || [],
    pathParams: pathParams
  };
}

/**
 * 엔드포인트에서 경로 파라미터 추출
 * 예: "/user/{id}/posts/{postId}" → [{name: "id", type: "string"}, {name: "postId", type: "string"}]
 */
export function extractPathParams(endpoint: string): ApiParam[] {
  const pathParamRegex = /\{([^}]+)\}/g;
  const matches = endpoint.matchAll(pathParamRegex);

  return Array.from(matches).map(match => ({
    name: match[1],
    type: "string", // 기본값, 추후 타입 추론 로직 추가 가능
    description: `경로 파라미터: ${match[1]}`,
    required: true
  }));
}

/**
 * 파라미터 배열을 객체 형태로 변환
 * 예: [{name: "userId", type: "string"}] → {userId: "string"}
 */
export function paramsToObject(params: ApiParam[]): Record<string, string> {
  return params.reduce((acc, param) => {
    acc[param.name] = param.type;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * 파라미터 배열에서 필수 파라미터만 필터링
 */
export function getRequiredParams(params: ApiParam[]): ApiParam[] {
  return params.filter(param => param.required);
}

/**
 * 파라미터 배열에서 선택적 파라미터만 필터링
 */
export function getOptionalParams(params: ApiParam[]): ApiParam[] {
  return params.filter(param => !param.required);
}

/**
 * 파라미터를 타입별로 그룹화
 */
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

/**
 * 파라미터 유효성 검사
 */
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

  // 파라미터 이름 검증 (camelCase, snake_case 허용)
  const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (param.name && !namePattern.test(param.name)) {
    errors.push('파라미터 이름은 영문자로 시작하고 영문자, 숫자, 언더스코어만 포함할 수 있습니다');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 파라미터 배열 전체 유효성 검사
 */
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

  // 중복 파라미터 이름 검사
  const names = params.map(p => p.name).filter(Boolean);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length > 0) {
    errors['duplicate_names'] = [`중복된 파라미터 이름: ${duplicates.join(', ')}`];
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * 파라미터를 예시 값으로 변환
 */
export function generateParamExamples(params: ApiParam[]): Record<string, unknown> {
  const examples: Record<string, unknown> = {};

  params.forEach(param => {
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
        examples[param.name] = { key: 'value' };
        break;
      default:
        examples[param.name] = `${param.type}_example`;
    }
  });

  return examples;
}

/**
 * 파라미터를 JSON Schema 형태로 변환
 */
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