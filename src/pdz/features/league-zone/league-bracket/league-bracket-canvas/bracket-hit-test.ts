import {
  deleteButtonRect,
  editButtonRect,
  HitKind,
  replayButtonRect,
  slotRect,
} from './bracket-canvas-renderer';
import { CanvasLayout, HEADER_H } from './bracket-layout';

export interface HitRegion {
  kind: HitKind;
  matchId?: string;
  slotIndex?: 0 | 1;
  section?: string;
  round?: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function buildHitRegions(
  layout: CanvasLayout,
  editable: boolean,
): HitRegion[] {
  const regions: HitRegion[] = [];

  if (editable) {
    for (const section of layout.sections) {
      for (const col of section.columns) {
        regions.push({
          kind: 'round-title',
          section: col.section,
          round: col.round,
          x: col.x,
          y: col.headerY,
          w: section.width,
          h: HEADER_H,
        });
      }
    }
  }

  for (const match of layout.matches) {
    regions.push({
      kind: 'match-card',
      matchId: match.id,
      section: match.section,
      round: match.round,
      x: match.x,
      y: match.y,
      w: match.w,
      h: match.h,
    });

    if (editable) {
      for (const slotIndex of [0, 1] as const) {
        regions.push({
          kind: 'slot',
          matchId: match.id,
          slotIndex,
          ...slotRect(match, slotIndex),
        });
      }
    }

    if (editable) {
      regions.push({
        kind: 'edit-icon',
        matchId: match.id,
        ...editButtonRect(match),
      });
      regions.push({
        kind: 'delete-icon',
        matchId: match.id,
        ...deleteButtonRect(match),
      });
    } else if (match.winner !== undefined && match.replay) {
      regions.push({
        kind: 'replay-link',
        matchId: match.id,
        ...replayButtonRect(match),
      });
    }
  }

  if (editable) {
    for (const btn of layout.addMatchButtons) {
      regions.push({
        kind: 'add-match-btn',
        section: btn.section,
        round: btn.round,
        x: btn.x,
        y: btn.y,
        w: btn.w,
        h: btn.h,
      });
    }
    for (const btn of layout.addRoundButtons) {
      regions.push({
        kind: 'add-round-btn',
        section: btn.section,
        round: btn.round,
        x: btn.x,
        y: btn.y,
        w: btn.w,
        h: btn.h,
      });
    }
  }

  return regions;
}

function segmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq
    ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
    : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function hitTestConnector(
  wx: number,
  wy: number,
  connectors: readonly { points: { x: number; y: number }[] }[],
  tolerance: number,
): number | null {
  let best: number | null = null;
  let bestDist = tolerance;
  for (let i = 0; i < connectors.length; i++) {
    const pts = connectors[i].points;
    for (let j = 0; j < pts.length - 1; j++) {
      const d = segmentDistance(
        wx,
        wy,
        pts[j].x,
        pts[j].y,
        pts[j + 1].x,
        pts[j + 1].y,
      );
      if (d <= bestDist) {
        bestDist = d;
        best = i;
      }
    }
  }
  return best;
}

export function queryHitRegion(
  wx: number,
  wy: number,
  regions: HitRegion[],
): HitRegion | null {
  for (let i = regions.length - 1; i >= 0; i--) {
    const r = regions[i];
    if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h) {
      return r;
    }
  }
  return null;
}
