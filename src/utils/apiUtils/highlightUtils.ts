// API 문서용 하이라이트 색상
export const COLORS = {
  keyword: '#ff7b72',    // import, const, await, method, print, flags
  function: '#cda3f9',   // axios, fetch, requests, print, curl, done
  string: '#9fcef8',     // url, headers, data, json, method names, endpoint, values
  variable: '#9fcef8',   // headers, data, response
  key: '#9fcef8',        // object keys
  punctuation: '#d1d6db', // :, ,
  special: '#ffa656'      // require
} as const;

export type ColorType = keyof typeof COLORS;

// 텍스트에 색상 적용
export function wrapColor(text: string, type: ColorType): string {
  return `<span style="color: ${COLORS[type]}">${text}</span>`;
}

// JSON 문자열 하이라이트
export function highlightJson(json: string): string {
  return json
    .replace(/"([^"]+)":/g, `${wrapColor('"$1"', 'key')}${wrapColor(':', 'punctuation')}`)
    .replace(/: "([^"]+)"/g, `: ${wrapColor('"$1"', 'string')}`)
    .replace(/: (\d+)/g, `: ${wrapColor('$1', 'string')}`)
    .replace(/: (true|false|null)/g, `: ${wrapColor('$1', 'keyword')}`)
    .replace(/,/g, wrapColor(',', 'punctuation'));
}
