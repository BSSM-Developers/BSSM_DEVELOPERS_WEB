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

// 일반 코드 하이라이트 (JS, Python)
export function highlightCode(code: string, language: string): string {
  if (!code) return "";

  const lang = language.toLowerCase();

  // 1. HTML 이스케이프
  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const tokens: string[] = [];
  const addToken = (text: string, type: ColorType) => {
    const id = tokens.length;
    tokens.push(wrapColor(text, type));
    return `___TOKEN_${id}___`;
  };

  // 2. 문자열 및 주석 추출 (플레이스홀더로 대체)
  // 주석과 문자열을 동시에 찾아야 서로 간섭하지 않음
  if (lang === 'javascript' || lang === 'js') {
    escaped = escaped.replace(/\/\/.*$|'[^']*'|"[^"]*"|`[^`]*`/gm, (match) => {
      if (match.startsWith('//')) return addToken(match, 'punctuation'); // 주석
      return addToken(match, 'string'); // 문자열
    });
  } else if (lang === 'python' || lang === 'py') {
    escaped = escaped.replace(/#.*$|'[^']*'|"[^"]*"/gm, (match) => {
      if (match.startsWith('#')) return addToken(match, 'punctuation'); // 주석
      return addToken(match, 'string'); // 문자열
    });
  }

  // 3. 키워드 및 함수 하이라이트 (플레이스홀더가 없는 텍스트에만 적용됨)
  if (lang === 'javascript' || lang === 'js') {
    escaped = escaped
      .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|await|async|try|catch|new|class|extends)\b/g, wrapColor('$1', 'keyword'))
      .replace(/\b(console|window|document|Math|JSON|Object|Array)\b/g, wrapColor('$1', 'special'))
      .replace(/\b(\w+)(?=\s*\()/g, wrapColor('$1', 'function'));
  } else if (lang === 'python' || lang === 'py') {
    escaped = escaped
      .replace(/\b(def|return|if|else|elif|for|while|import|from|as|try|except|class|with|is|in|not|and|or|lambda|None|True|False)\b/g, wrapColor('$1', 'keyword'))
      .replace(/\b(print|len|range|str|int|float|list|dict|set|type|open)\b/g, wrapColor('$1', 'function'));
  }

  // 4. 플레이스홀더 복원
  tokens.forEach((token, i) => {
    escaped = escaped.replace(`___TOKEN_${i}___`, token);
  });

  return escaped;
}
