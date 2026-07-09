/**
 * Resolves the semantic design tokens the canvas bracket renderer draws with.
 * Canvas can't consume CSS custom properties directly, so we snapshot them via
 * getComputedStyle. The snapshot is cached by the component and re-resolved
 * when the theme attributes on <html> change (see the MutationObserver in
 * LeagueBracketCanvasComponent) — never per frame.
 */

export const BRACKET_COLOR_TOKENS = [
  'on-surface',
  'on-surface-variant',
  'surface',
  'surface-container',
  'surface-container-low',
  'outline',
  'outline-variant',
  'positive',
  'positive-container',
  'negative',
  'negative-container',
  'primary',
  'primary-darker',
  'on-primary',
  'secondary',
  'secondary-darker',
  'on-secondary',
] as const;

export type BracketColorToken = (typeof BRACKET_COLOR_TOKENS)[number];

export interface BracketTheme {
  colors: Record<BracketColorToken, string>;
  /** e.g. "Nasalization RG" — labels, headers, seed numbers. */
  fontFancy: string;
  /** The app's base body font stack. */
  fontRegular: string;
  fontWeightBold: string;
  /** rgb triplet backing --pdz-color-shadow-rgb, used for card shadows. */
  shadowRgb: string;
}

export function resolveBracketTheme(
  root: HTMLElement = document.documentElement,
): BracketTheme {
  const style = getComputedStyle(root);
  const read = (prop: string, fallback: string): string =>
    style.getPropertyValue(prop).trim() || fallback;

  const colors = Object.fromEntries(
    BRACKET_COLOR_TOKENS.map((t) => [t, read(`--pdz-color-${t}`, '#888')]),
  ) as Record<BracketColorToken, string>;

  return {
    colors,
    fontFancy: read('--pdz-font-fancy', 'sans-serif'),
    fontRegular: read(
      '--pdz-font-regular',
      getComputedStyle(document.body).fontFamily || 'sans-serif',
    ),
    fontWeightBold: read('--pdz-font-weight-bold', '700'),
    shadowRgb: read('--pdz-color-shadow-rgb', '0, 0, 0'),
  };
}
