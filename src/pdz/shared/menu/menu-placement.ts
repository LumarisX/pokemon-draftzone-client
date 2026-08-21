export type MenuAlign = 'start' | 'end';

export interface MenuRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface MenuViewport {
  width: number;
  height: number;
}

export interface MenuPlacement {
  left: number;
  top: number | null;
  bottom: number | null;
  maxHeight: number;
  flipped: boolean;
}

export const MENU_GAP = 4;
export const MENU_MIN_HEIGHT = 120;

export function resolveMenuPlacement(
  trigger: MenuRect,
  panel: Pick<MenuRect, 'width' | 'height'>,
  align: MenuAlign,
  viewport: MenuViewport,
): MenuPlacement {
  const triggerBottom = trigger.top + trigger.height;
  const below = viewport.height - triggerBottom;
  const above = trigger.top;
  const flipped = below < panel.height + MENU_GAP * 2 && above > below;

  const maxHeight = Math.max(
    MENU_MIN_HEIGHT,
    (flipped ? above : below) - MENU_GAP * 2,
  );

  const preferred =
    align === 'start' ? trigger.left : trigger.left + trigger.width - panel.width;
  const rightmost = Math.max(MENU_GAP, viewport.width - panel.width - MENU_GAP);
  const left = Math.min(Math.max(MENU_GAP, preferred), rightmost);

  return flipped
    ? {
        left,
        top: null,
        bottom: viewport.height - trigger.top + MENU_GAP,
        maxHeight,
        flipped,
      }
    : {
        left,
        top: triggerBottom + MENU_GAP,
        bottom: null,
        maxHeight,
        flipped,
      };
}
