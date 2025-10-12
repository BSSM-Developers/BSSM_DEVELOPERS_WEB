import { Theme } from "@emotion/react";

export const applyTypography = (theme: Theme, type: keyof Theme["typography"]) => {
  const typo = theme.typography[type];

  return {
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    lineHeight: typo.lineHeight,
    letterSpacing: typo.letterSpacing,
    fontWeight: typo.fontWeight ? theme.fontWeights[typo.fontWeight] : undefined,
  };
};