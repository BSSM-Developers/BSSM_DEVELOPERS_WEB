/**
 * DOM 요소 → 안정적 CSS 셀렉터 생성 (튜토리얼 편집기에서 드래그 지점 요소를 저장용 셀렉터로 변환).
 * 우선순위: [data-tour] > #id > nth-of-type 체인.
 */

/** 요소에서 셀렉터 생성. 실패/모호하면 null */
export function buildSelector(el: Element | null): string | null {
  if (!el || !(el instanceof Element)) return null;

  // 1) data-tour 우선 (가장 안정적)
  const tour = el.closest("[data-tour]");
  if (tour) {
    const v = tour.getAttribute("data-tour");
    if (v) {
      const sel = `[data-tour="${v}"]`;
      if (isUnique(sel)) return sel;
    }
  }

  // 2) 고유 id
  if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) {
    const sel = `#${el.id}`;
    if (isUnique(sel)) return sel;
  }

  // 3) nth-of-type 체인 (body까지)
  const path: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== "html") {
    let part = node.tagName.toLowerCase();
    if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
      part = `#${node.id}`;
      path.unshift(part);
      break; // id 만나면 거기서 종료(짧고 안정적)
    }
    const parent: Element | null = node.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (c) => c.tagName === node!.tagName
      );
      if (sameTag.length > 1) {
        const idx = sameTag.indexOf(node) + 1;
        part += `:nth-of-type(${idx})`;
      }
    }
    path.unshift(part);
    node = parent;
  }

  const sel = path.join(" > ");
  return sel || null;
}

/** 셀렉터가 정확히 1개 요소만 매칭하는지 */
export function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}
