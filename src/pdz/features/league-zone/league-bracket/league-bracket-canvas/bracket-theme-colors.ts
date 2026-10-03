export const BRACKET_COLOR_TOKENS = [
  'on-surface',
  'on-surface-variant',
  'raised',
  'inset',
  'border-subtle',
  'border-control',
  'outline',
  'positive',
  'positive-container',
  'negative',
  'negative-container',
  'primary',
  'primary-hover',
  'on-primary',
  'secondary',
  'secondary-hover',
  'on-secondary',
] as const;

export type BracketColorToken = (typeof BRACKET_COLOR_TOKENS)[number];

export interface BracketTheme {
  colors: Record<BracketColorToken, string>;
  fontRegular: string;
  fontWeightBold: string;
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
    fontRegular: read(
      '--pdz-font-body',
      getComputedStyle(document.body).fontFamily || 'sans-serif',
    ),
    fontWeightBold: read('--pdz-font-weight-bold', '700'),
    shadowRgb: read('--pdz-color-shadow-rgb', '0, 0, 0'),
  };
}
