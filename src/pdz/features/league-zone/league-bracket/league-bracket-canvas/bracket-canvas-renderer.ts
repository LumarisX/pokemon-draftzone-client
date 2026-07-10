import {
  ADD_BTN_H,
  CARD_PAD,
  CanvasButton,
  CanvasLayout,
  CanvasMatch,
  CanvasSlot,
  COL_W,
  HEADER_H,
  LABEL_H,
  ROW_GAP,
  SECTION_TITLE_H,
  TEAM_H,
} from './bracket-layout';
import { BracketTheme } from './bracket-theme-colors';

// ─── View / interaction state ─────────────────────────────────────────────────

export interface BracketViewTransform {
  x: number;
  y: number;
  k: number;
}

export type HitKind =
  | 'match-card'
  | 'edit-icon'
  | 'delete-icon'
  | 'add-match-btn'
  | 'add-round-btn'
  | 'slot'
  | 'replay-link'
  | 'round-title';

export interface BracketInteractionState {
  hoveredMatchId?: string | null;
  hoveredKind?: HitKind | null;
  hoveredSlotIndex?: 0 | 1 | null;
  /** `${section}::${round}` of the hovered add button. */
  hoveredButtonKey?: string | null;
  /** Index into layout.connectors of the line under the pointer. */
  hoveredConnectorIndex?: number | null;
  drag?: {
    matchId: string;
    /** World-space offset of the dragged ghost from the card's laid-out position. */
    dx: number;
    dy: number;
    targetSection?: string;
    targetRound?: number;
    /** World-space y of the insertion indicator line, if a target is resolved. */
    insertY?: number | null;
    /** World-space x of the target column, for the indicator line. */
    targetColX?: number | null;
  } | null;
}

export interface RenderOptions {
  layout: CanvasLayout;
  theme: BracketTheme;
  transform: BracketViewTransform;
  dpr: number;
  viewWidth: number;
  viewHeight: number;
  editable: boolean;
  state: BracketInteractionState;
  /** Returns a decoded image for a logo URL, or null while it loads. */
  resolveImage: (url: string | undefined) => HTMLImageElement | null;
}

// ─── Card sub-rects (shared with hit-testing) ─────────────────────────────────

export const DELETE_BTN_SIZE = 20;
export const REPLAY_W = 48;
export const REPLAY_H = 18;

export function deleteButtonRect(m: CanvasMatch) {
  return {
    x: m.x + m.w - CARD_PAD - 4 - DELETE_BTN_SIZE,
    y: m.y + CARD_PAD + (LABEL_H - DELETE_BTN_SIZE) / 2,
    w: DELETE_BTN_SIZE,
    h: DELETE_BTN_SIZE,
  };
}

export function editButtonRect(m: CanvasMatch) {
  const del = deleteButtonRect(m);
  return { ...del, x: del.x - DELETE_BTN_SIZE - 4 };
}

export function replayButtonRect(m: CanvasMatch) {
  return {
    x: m.x + m.w - CARD_PAD - 4 - REPLAY_W,
    y: m.y + CARD_PAD + (LABEL_H - REPLAY_H) / 2,
    w: REPLAY_W,
    h: REPLAY_H,
  };
}

export function slotRect(m: CanvasMatch, slotIndex: 0 | 1) {
  return {
    x: m.x + CARD_PAD,
    y: m.slotY[slotIndex],
    w: m.w - CARD_PAD * 2,
    h: TEAM_H,
  };
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '…';
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo > 0 ? text.slice(0, lo) + ellipsis : ellipsis;
}

/** Traces an orthogonal connector polyline, rounding every corner. Works for
 *  any travel direction — up, down, left, or right. */
function traceConnector(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
): void {
  ctx.beginPath();
  if (points.length < 2) return;
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const p = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(p.x - prev.x, p.y - prev.y);
    const outLen = Math.hypot(next.x - p.x, next.y - p.y);
    const r = Math.min(6, inLen / 2, outLen / 2);
    if (r < 0.5) {
      ctx.lineTo(p.x, p.y);
      continue;
    }
    ctx.lineTo(
      p.x - ((p.x - prev.x) / inLen) * r,
      p.y - ((p.y - prev.y) / inLen) * r,
    );
    ctx.quadraticCurveTo(
      p.x,
      p.y,
      p.x + ((next.x - p.x) / outLen) * r,
      p.y + ((next.y - p.y) / outLen) * r,
    );
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

// ─── Background grid ──────────────────────────────────────────────────────────

const GRID_BASE_SPACING = 32;

/** Subtle dot grid drawn in world space, so it pans and zooms with the
 *  bracket. Spacing doubles as you zoom out so dot density (and draw cost)
 *  stays roughly constant. */
function drawDotGrid(ctx: CanvasRenderingContext2D, opts: RenderOptions): void {
  const { theme, transform, viewWidth, viewHeight } = opts;
  const k = transform.k;
  if (!(k > 0)) return;

  let spacing = GRID_BASE_SPACING;
  while (spacing * k < 22) spacing *= 2;
  while (spacing * k > 88) spacing /= 2;

  // Visible world rect, snapped outward to the grid.
  const x0 = Math.floor(-transform.x / k / spacing) * spacing;
  const y0 = Math.floor(-transform.y / k / spacing) * spacing;
  const x1 = (viewWidth - transform.x) / k;
  const y1 = (viewHeight - transform.y) / k;

  const r = 1.1 / k; // ~1px on screen regardless of zoom
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = theme.colors['outline-variant'];
  ctx.beginPath();
  for (let gx = x0; gx <= x1; gx += spacing) {
    for (let gy = y0; gy <= y1; gy += spacing) {
      ctx.rect(gx - r, gy - r, r * 2, r * 2);
    }
  }
  ctx.fill();
  ctx.restore();
}

// ─── Frame render ─────────────────────────────────────────────────────────────

export function renderBracket(
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions,
): void {
  const { layout, theme, transform, dpr, viewWidth, viewHeight, editable, state } =
    opts;
  const c = theme.colors;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, viewWidth * dpr, viewHeight * dpr);
  ctx.setTransform(
    dpr * transform.k,
    0,
    0,
    dpr * transform.k,
    dpr * transform.x,
    dpr * transform.y,
  );

  if (editable) drawDotGrid(ctx, opts);

  // 1. Connectors (behind everything). Winner lines are green, loser lines
  // red; dashed until the source match is decided, then solid. The hovered
  // line is drawn last, thicker and with a soft halo, so it pops.
  const hoveredConn = state.hoveredConnectorIndex ?? null;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  for (let i = 0; i < layout.connectors.length; i++) {
    if (i === hoveredConn) continue;
    const conn = layout.connectors[i];
    ctx.strokeStyle = conn.cls === 'winner' ? c['positive'] : c['negative'];
    ctx.setLineDash(conn.decided ? [] : [5, 5]);
    traceConnector(ctx, conn.points);
    ctx.stroke();
  }
  if (hoveredConn !== null && layout.connectors[hoveredConn]) {
    const conn = layout.connectors[hoveredConn];
    const color = conn.cls === 'winner' ? c['positive'] : c['negative'];
    ctx.strokeStyle = color;
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 8;
    traceConnector(ctx, conn.points);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.setLineDash(conn.decided ? [] : [5, 5]);
    traceConnector(ctx, conn.points);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 2. Section titles + round headers
  for (const section of layout.sections) {
    if (section.titleY !== null && section.title) {
      ctx.font = `600 15px ${theme.fontFancy}`;
      ctx.fillStyle = c['on-surface-variant'];
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(section.title.toUpperCase(), 0, section.titleY + 2);
      ctx.strokeStyle = c['outline-variant'];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, section.titleY + SECTION_TITLE_H - 0.5);
      ctx.lineTo(section.width, section.titleY + SECTION_TITLE_H - 0.5);
      ctx.stroke();
    }

    ctx.font = `600 14px ${theme.fontFancy}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    for (const col of section.columns) {
      const titleHovered =
        editable &&
        state.hoveredKind === 'round-title' &&
        state.hoveredButtonKey === `${col.section}::${col.round}`;
      ctx.fillStyle = titleHovered ? c['primary'] : c['on-surface-variant'];
      const text = truncate(ctx, col.title, COL_W);
      ctx.fillText(text, col.x + COL_W / 2, col.headerY + (HEADER_H - 14) / 2);
      if (editable) {
        // Dashed underline hints that round titles are click-to-rename.
        const tw = Math.min(ctx.measureText(text).width + 12, COL_W);
        ctx.strokeStyle = titleHovered ? c['primary'] : c['outline-variant'];
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(col.x + (COL_W - tw) / 2, col.headerY + HEADER_H - 3);
        ctx.lineTo(col.x + (COL_W + tw) / 2, col.headerY + HEADER_H - 3);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
  ctx.textAlign = 'left';

  // 3. Match cards
  const dragging = state.drag ?? null;
  for (const match of layout.matches) {
    if (dragging?.matchId === match.id) continue; // ghost drawn last, on top
    drawMatchCard(ctx, match, opts, 1, 0, 0);
  }

  // 4. Edit-mode add buttons
  if (editable) {
    for (const btn of layout.addMatchButtons) {
      drawAddButton(ctx, btn, '+ Match', opts);
    }
    for (const btn of layout.addRoundButtons) {
      drawAddButton(ctx, btn, '+ Round', opts);
    }
  }

  // 5. Drag ghost + insertion indicator
  if (dragging) {
    const match = layout.matches.find((m) => m.id === dragging.matchId);
    if (match) {
      if (
        dragging.insertY != null &&
        dragging.targetColX != null
      ) {
        ctx.strokeStyle = c['primary'];
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(dragging.targetColX, dragging.insertY);
        ctx.lineTo(dragging.targetColX + COL_W, dragging.insertY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 0.92;
      drawMatchCard(ctx, match, opts, 3, dragging.dx, dragging.dy);
      ctx.globalAlpha = 1;
    }
  }
}

function drawShadow(
  ctx: CanvasRenderingContext2D,
  theme: BracketTheme,
  level: 1 | 2 | 3,
): void {
  const blur = level === 1 ? 3 : level === 2 ? 6 : 12;
  const offsetY = level === 1 ? 1 : level === 2 ? 2 : 5;
  ctx.shadowColor = `rgba(${theme.shadowRgb}, 0.28)`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = offsetY;
}

function clearShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawMatchCard(
  ctx: CanvasRenderingContext2D,
  match: CanvasMatch,
  opts: RenderOptions,
  shadowLevel: 1 | 2 | 3,
  offsetX: number,
  offsetY: number,
): void {
  const { theme, editable, state, resolveImage } = opts;
  const c = theme.colors;
  const x = match.x + offsetX;
  const y = match.y + offsetY;
  const hovered =
    state.hoveredMatchId === match.id && shadowLevel === 1 ? 2 : shadowLevel;

  // Card chrome
  drawShadow(ctx, theme, hovered as 1 | 2 | 3);
  ctx.fillStyle = c['surface-container-low'];
  roundedRect(ctx, x, y, match.w, match.h, 12);
  ctx.fill();
  clearShadow(ctx);
  ctx.strokeStyle = c['outline-variant'];
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label row
  const labelY = y + CARD_PAD;
  let labelX = x + CARD_PAD + 4;
  ctx.textBaseline = 'middle';

  if (editable) {
    // Drag handle glyph
    ctx.font = `12px ${theme.fontRegular}`;
    ctx.fillStyle = c['on-surface-variant'];
    ctx.fillText('⠿', labelX, labelY + LABEL_H / 2 + 1);
    labelX += 16;
  }

  ctx.font = `${theme.fontWeightBold} 13px ${theme.fontFancy}`;
  ctx.fillStyle = c['on-surface-variant'];
  const labelMaxW = editable
    ? match.w - CARD_PAD * 2 - 16 - (DELETE_BTN_SIZE + 4) * 2 - 8
    : match.w - CARD_PAD * 2 - REPLAY_W - 12;
  ctx.fillText(
    truncate(ctx, match.label, labelMaxW),
    labelX,
    labelY + LABEL_H / 2 + 1,
  );

  if (editable) {
    const edit = editButtonRect(match);
    const editHovered =
      state.hoveredKind === 'edit-icon' && state.hoveredMatchId === match.id;
    if (editHovered) {
      ctx.fillStyle = c['surface-container'];
      roundedRect(
        ctx,
        edit.x + offsetX,
        edit.y + offsetY,
        edit.w,
        edit.h,
        edit.w / 2,
      );
      ctx.fill();
    }
    ctx.font = `12px ${theme.fontRegular}`;
    ctx.fillStyle = editHovered ? c['primary'] : c['on-surface-variant'];
    ctx.textAlign = 'center';
    ctx.fillText(
      '✎',
      edit.x + offsetX + edit.w / 2,
      edit.y + offsetY + edit.h / 2 + 1,
    );

    const del = deleteButtonRect(match);
    const delHovered =
      state.hoveredKind === 'delete-icon' && state.hoveredMatchId === match.id;
    if (delHovered) {
      ctx.fillStyle = c['negative-container'];
      roundedRect(ctx, del.x + offsetX, del.y + offsetY, del.w, del.h, del.w / 2);
      ctx.fill();
    }
    ctx.font = `16px ${theme.fontRegular}`;
    ctx.fillStyle = delHovered ? c['negative'] : c['on-surface-variant'];
    ctx.fillText(
      '×',
      del.x + offsetX + del.w / 2,
      del.y + offsetY + del.h / 2 + 1,
    );
    ctx.textAlign = 'left';
  } else if (match.winner !== undefined) {
    const pill = replayButtonRect(match);
    const enabled = !!match.replay;
    const pillHovered =
      enabled &&
      state.hoveredKind === 'replay-link' &&
      state.hoveredMatchId === match.id;
    ctx.globalAlpha = enabled ? 1 : 0.5;
    if (enabled) {
      ctx.fillStyle = pillHovered ? c['primary-darker'] : c['primary'];
      roundedRect(ctx, pill.x + offsetX, pill.y + offsetY, pill.w, pill.h, pill.h / 2);
      ctx.fill();
      ctx.fillStyle = c['on-primary'];
    } else {
      ctx.strokeStyle = c['outline'];
      ctx.lineWidth = 1;
      roundedRect(ctx, pill.x + offsetX, pill.y + offsetY, pill.w, pill.h, pill.h / 2);
      ctx.stroke();
      ctx.fillStyle = c['on-surface-variant'];
    }
    ctx.font = `11px ${theme.fontRegular}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      'Replay',
      pill.x + offsetX + pill.w / 2,
      pill.y + offsetY + pill.h / 2 + 1,
    );
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // Team rows
  for (const slotIndex of [0, 1] as const) {
    drawTeamRow(ctx, match, slotIndex, opts, offsetX, offsetY);
  }
  ctx.textBaseline = 'alphabetic';
}

function drawTeamRow(
  ctx: CanvasRenderingContext2D,
  match: CanvasMatch,
  slotIndex: 0 | 1,
  opts: RenderOptions,
  offsetX: number,
  offsetY: number,
): void {
  const { theme, editable, resolveImage, layout, state } = opts;
  const c = theme.colors;
  const slot: CanvasSlot = match.slots[slotIndex];
  const rect = slotRect(match, slotIndex);
  const x = rect.x + offsetX;
  const y = rect.y + offsetY;

  const bg =
    slot.status === 'winner'
      ? c['positive-container']
      : slot.status === 'loser'
        ? c['negative-container']
        : c['surface-container'];
  ctx.fillStyle = bg;
  roundedRect(ctx, x, y, rect.w, rect.h, 8);
  ctx.fill();

  const slotHovered =
    editable &&
    state.hoveredKind === 'slot' &&
    state.hoveredMatchId === match.id &&
    state.hoveredSlotIndex === slotIndex;
  if (slotHovered) {
    ctx.strokeStyle = c['primary'];
    ctx.lineWidth = 1;
    roundedRect(ctx, x + 0.5, y + 0.5, rect.w - 1, rect.h - 1, 8);
    ctx.stroke();
  }

  if (editable) {
    // Slot picker row: current selection text + dropdown caret
    const raw = slot.raw;
    let text: string;
    if (raw.type === 'seed' || raw.type === 'bye') {
      const team = slot.team;
      text = team ? `Seed ${raw.seed} — ${team.teamName}` : `Seed ${raw.seed}`;
    } else if (raw.type === 'winner') {
      text = `Winner of ${layout.matchLabelById.get(raw.from) ?? raw.from}`;
    } else if (raw.type === 'loser') {
      text = `Loser of ${layout.matchLabelById.get(raw.from) ?? raw.from}`;
    } else {
      text = '— Unassigned —';
    }
    ctx.font = `13px ${theme.fontRegular}`;
    ctx.fillStyle = c['on-surface'];
    ctx.fillText(truncate(ctx, text, rect.w - 40), x + 12, y + rect.h / 2 + 1);
    ctx.fillStyle = c['on-surface-variant'];
    ctx.font = `10px ${theme.fontRegular}`;
    ctx.fillText('▾', x + rect.w - 18, y + rect.h / 2 + 1);
    return;
  }

  if (slot.team) {
    const team = slot.team;
    let textX = x + 12;

    // Logo box always reserved — getLogoUrl falls back to the default logo.
    const img = resolveImage(team.logo);
    if (img && img.width > 0 && img.height > 0) {
      // object-fit: contain within a 36x36 box
      const box = 36;
      const scale = Math.min(box / img.width, box / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, textX + (box - dw) / 2, y + (rect.h - dh) / 2, dw, dh);
    }
    textX += 36 + 8;

    const maxW = x + rect.w - 10 - textX;
    ctx.font = `${theme.fontWeightBold} 14px ${theme.fontRegular}`;
    ctx.fillStyle = c['on-surface'];
    ctx.fillText(truncate(ctx, team.teamName, maxW), textX, y + 17);

    ctx.font = `${theme.fontWeightBold} 12px ${theme.fontFancy}`;
    ctx.fillStyle = c['secondary'];
    const seedText = `${team.seed}`;
    ctx.fillText(seedText, textX, y + 34);
    const seedW = ctx.measureText(seedText).width;

    ctx.font = `${theme.fontWeightBold} 12px ${theme.fontRegular}`;
    ctx.fillStyle = c['primary'];
    ctx.fillText(
      truncate(ctx, team.coachName, maxW - seedW - 6),
      textX + seedW + 6,
      y + 34,
    );
  } else {
    ctx.font = `italic 12.5px ${theme.fontFancy}`;
    ctx.fillStyle = c['on-surface-variant'];
    ctx.textAlign = 'center';
    ctx.fillText(
      truncate(ctx, slot.placeholder ?? 'TBD', rect.w - 16),
      x + rect.w / 2,
      y + rect.h / 2 + 1,
    );
    ctx.textAlign = 'left';
  }
}

function drawAddButton(
  ctx: CanvasRenderingContext2D,
  btn: CanvasButton,
  text: string,
  opts: RenderOptions,
): void {
  const { theme, state } = opts;
  const c = theme.colors;
  const kind = text === '+ Match' ? 'add-match-btn' : 'add-round-btn';
  const hovered =
    state.hoveredKind === kind &&
    state.hoveredButtonKey === `${btn.section}::${btn.round}`;
  const color = hovered ? c['primary'] : c['on-surface-variant'];
  const border = hovered ? c['primary'] : c['outline-variant'];

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  roundedRect(ctx, btn.x, btn.y, btn.w, btn.h, 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `13px ${theme.fontRegular}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
