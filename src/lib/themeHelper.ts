import { Theme } from "@emotion/react";

/**
 * 공통 반응형 breakpoint (max-width 기준, px).
 */
export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

/**
 * Emotion styled용 미디어쿼리 헬퍼.
 *   const Box = styled.div`
 *     ${media.tablet} { flex-direction: column; }
 *     ${media.mobile} { padding: 12px; }
 *   `;
 */
export const media = {
  mobile: `@media (max-width: ${breakpoints.mobile}px)`,
  tablet: `@media (max-width: ${breakpoints.tablet}px)`,
  desktop: `@media (max-width: ${breakpoints.desktop}px)`,
  wide: `@media (max-width: ${breakpoints.wide}px)`,
} as const;

export const applyTypography = (theme: Theme, type: keyof Theme["typography"]) => {
  const typo = theme.typography[type];

  if (!typo) {
    return {
      fontFamily: undefined,
      fontSize: undefined,
      lineHeight: undefined,
      letterSpacing: undefined,
      fontWeight: undefined,
    };
  }

  return {
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    lineHeight: typo.lineHeight,
    letterSpacing: typo.letterSpacing,
    fontWeight: typo.fontWeight ? theme.fontWeights[typo.fontWeight] : undefined,
  };
};