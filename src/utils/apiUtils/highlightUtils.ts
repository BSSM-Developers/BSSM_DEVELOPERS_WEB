export const COLORS = {
  keyword: '#ff7b72',
  function: '#cda3f9',
  string: '#9fcef8',
  variable: '#9fcef8',
  key: '#9fcef8',
  punctuation: '#d1d6db',
  special: '#ffa656'
} as const;

export type ColorType = keyof typeof COLORS;

export function wrapColor(text: string, type: ColorType): string {
  return `<span style="color: ${COLORS[type]}">${text}</span>`;
}

export function highlightJson(json: string): string {
  return json
    .replace(/"([^"]+)":/g, `${wrapColor('"$1"', 'key')}${wrapColor(':', 'punctuation')}`)
    .replace(/: "([^"]+)"/g, `: ${wrapColor('"$1"', 'string')}`)
    .replace(/: (\d+)/g, `: ${wrapColor('$1', 'string')}`)
    .replace(/: (true|false|null)/g, `: ${wrapColor('$1', 'keyword')}`)
    .replace(/,/g, wrapColor(',', 'punctuation'));
}

export function highlightCode(code: string, language: string): string {
  if (!code) return "";

  const lang = language.toLowerCase();

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

  if (lang === 'json' || lang === 'jsonc') {
    return escaped
      .replace(/("(?:\\.|[^"\\])*")(\s*:)/g, (_, key: string, colon: string) => `${wrapColor(key, 'key')}${wrapColor(colon, 'punctuation')}`)
      .replace(/:\s*("(?:\\.|[^"\\])*")/g, (_, str: string) => `: ${wrapColor(str, 'string')}`)
      .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (_, num: string) => `: ${wrapColor(num, 'string')}`)
      .replace(/:\s*(true|false|null)\b/g, (_, literal: string) => `: ${wrapColor(literal, 'keyword')}`)
      .replace(/([{}[\],])/g, wrapColor('$1', 'punctuation'));
  }

  if (lang === 'javascript' || lang === 'js') {
    escaped = escaped.replace(/\/\/.*$|'[^']*'|"[^"]*"|`[^`]*`/gm, (match) => {
      if (match.startsWith('//')) return addToken(match, 'punctuation');
      return addToken(match, 'string');
    });
  } else if (lang === 'python' || lang === 'py') {
    escaped = escaped.replace(/#.*$|'[^']*'|"[^"]*"/gm, (match) => {
      if (match.startsWith('#')) return addToken(match, 'punctuation');
      return addToken(match, 'string');
    });
  }

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

  tokens.forEach((token, i) => {
    escaped = escaped.replace(`___TOKEN_${i}___`, token);
  });

  return escaped;
}
