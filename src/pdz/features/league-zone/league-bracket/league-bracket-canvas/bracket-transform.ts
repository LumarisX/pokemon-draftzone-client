import { BracketViewTransform } from './bracket-canvas-renderer';

/** Allowed zoom range. */
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 3;

export function worldToScreen(
  wx: number,
  wy: number,
  t: BracketViewTransform,
): { x: number; y: number } {
  return { x: t.x + wx * t.k, y: t.y + wy * t.k };
}

export function screenToWorld(
  sx: number,
  sy: number,
  t: BracketViewTransform,
): { x: number; y: number } {
  return { x: (sx - t.x) / t.k, y: (sy - t.y) / t.k };
}

/**
 * Transform that fits content of (contentW × contentH) into a viewport,
 * centered, never scaling past 100%.
 */
export function fitToContent(
  contentW: number,
  contentH: number,
  viewW: number,
  viewH: number,
  padding = 24,
): BracketViewTransform {
  if (contentW <= 0 || contentH <= 0 || viewW <= 0 || viewH <= 0) {
    return { x: padding, y: padding, k: 1 };
  }
  const k = Math.max(
    MIN_SCALE,
    Math.min(
      1,
      (viewW - padding * 2) / contentW,
      (viewH - padding * 2) / contentH,
    ),
  );
  return {
    k,
    x: (viewW - contentW * k) / 2,
    y: (viewH - contentH * k) / 2,
  };
}
