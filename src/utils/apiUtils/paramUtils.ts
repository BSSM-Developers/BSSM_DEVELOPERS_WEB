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
  const primitiveFromExample = (param: ApiParam): unknown => {
    if (param.example !== undefined && param.example !== "") {
      if (param.type === "number" || param.type === "integer") {
        return Number(param.example);
      }
      if (param.type === "boolean") {
        return param.example === "true";
      }
      if (param.type === "array" || param.type === "object") {
        try {
          return JSON.parse(param.example);
        } catch {
          return param.example;
        }
      }
      if (param.type === "null" || param.example === "null") {
        return null;
      }
      return param.example;
    }

    switch (param.type.toLowerCase()) {
      case "string":
        return param.name.includes("email")
          ? "user@example.com"
          : param.name.includes("name")
            ? "사용자명"
            : param.name.includes("id")
              ? "abc123"
              : "item_example";
      case "number":
      case "integer":
        return param.name.includes("age")
          ? 25
          : param.name.includes("count")
            ? 10
            : param.name.includes("id")
              ? 123
              : 42;
      case "boolean":
        return true;
      case "array":
        return [];
      case "object":
        return {};
      case "null":
        return null;
      case "any":
        return "any_value";
      default:
        return `${param.type}_example`;
    }
  };

  const paramToValue = (param: ApiParam): unknown => {
    if (param.type === "object") {
      if (param.children && param.children.length > 0) {
        return generateParamExamples(param.children);
      }
      return primitiveFromExample(param);
    }

    if (param.type === "array") {
      const children = param.children ?? [];
      if (children.length === 0) {
        return primitiveFromExample(param);
      }

      if (children.length === 1) {
        const child = children[0];
        if (child.type === "object" && child.children && child.children.length > 0) {
          return [generateParamExamples(child.children)];
        }
        return [paramToValue(child)];
      }

      const hasAllNamedChildren = children.every((child) => child.name.trim().length > 0);
      if (hasAllNamedChildren) {
        return [generateParamExamples(children)];
      }

      return children.map((child) => paramToValue(child));
    }

    return primitiveFromExample(param);
  };

  const examples: Record<string, unknown> = {};

  params.forEach(param => {
    if (!param.name.trim()) {
      return;
    }
    examples[param.name] = paramToValue(param);
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
