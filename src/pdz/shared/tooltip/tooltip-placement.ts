export type TooltipPosition =
  | 'above'
  | 'below'
  | 'before'
  | 'after'
  | 'left'
  | 'right';

export type ResolvedSide = 'above' | 'below' | 'left' | 'right';

export interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface Placement {
  left: number;
  top: number;
  side: ResolvedSide;
}

export const TOOLTIP_GAP = 8;
export const TOOLTIP_MARGIN = 8;

const SIDES: Record<TooltipPosition, ResolvedSide> = {
  above: 'above',
  below: 'below',
  before: 'left',
  after: 'right',
  left: 'left',
  right: 'right',
};

export function resolvePlacement(
  anchor: AnchorRect,
  tooltip: TooltipSize,
  position: TooltipPosition,
  viewport: Viewport,
  gap = TOOLTIP_GAP,
  margin = TOOLTIP_MARGIN,
): Placement {
  const side = SIDES[position] ?? 'above';
  return side === 'above' || side === 'below'
    ? vertical(anchor, tooltip, side, viewport, gap, margin)
    : horizontal(anchor, tooltip, side, viewport, gap, margin);
}

function vertical(
  anchor: AnchorRect,
  tooltip: TooltipSize,
  side: ResolvedSide,
  viewport: Viewport,
  gap: number,
  margin: number,
): Placement {
  const aboveTop = anchor.top - tooltip.height - gap;
  const belowTop = anchor.top + anchor.height + gap;
  const fitsAbove = aboveTop >= margin;
  const fitsBelow = belowTop + tooltip.height <= viewport.height - margin;

  let resolved = side;
  if (side === 'above' && !fitsAbove && fitsBelow) resolved = 'below';
  else if (side === 'below' && !fitsBelow && fitsAbove) resolved = 'above';

  return {
    left: clamp(
      anchor.left + anchor.width / 2 - tooltip.width / 2,
      margin,
      viewport.width - tooltip.width - margin,
    ),
    top: clamp(
      resolved === 'above' ? aboveTop : belowTop,
      margin,
      viewport.height - tooltip.height - margin,
    ),
    side: resolved,
  };
}

function horizontal(
  anchor: AnchorRect,
  tooltip: TooltipSize,
  side: ResolvedSide,
  viewport: Viewport,
  gap: number,
  margin: number,
): Placement {
  const leftLeft = anchor.left - tooltip.width - gap;
  const rightLeft = anchor.left + anchor.width + gap;
  const fitsLeft = leftLeft >= margin;
  const fitsRight = rightLeft + tooltip.width <= viewport.width - margin;

  let resolved = side;
  if (side === 'left' && !fitsLeft && fitsRight) resolved = 'right';
  else if (side === 'right' && !fitsRight && fitsLeft) resolved = 'left';

  return {
    left: clamp(
      resolved === 'left' ? leftLeft : rightLeft,
      margin,
      viewport.width - tooltip.width - margin,
    ),
    top: clamp(
      anchor.top + anchor.height / 2 - tooltip.height / 2,
      margin,
      viewport.height - tooltip.height - margin,
    ),
    side: resolved,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
