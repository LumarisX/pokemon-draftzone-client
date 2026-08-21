import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { resolvePlacement } from './tooltip-placement';
import { TOOLTIP_ID } from './tooltip.component';
import { TooltipDirective } from './tooltip.directive';
import { TooltipService } from './tooltip.service';

const VIEWPORT = { width: 1000, height: 800 };
const TOOLTIP = { width: 80, height: 24 };
const ANCHOR = { top: 400, left: 400, width: 100, height: 20 };

describe('resolvePlacement', () => {
  it('centers above the anchor with a gap', () => {
    expect(resolvePlacement(ANCHOR, TOOLTIP, 'above', VIEWPORT)).toEqual({
      left: 410,
      top: 368,
      side: 'above',
    });
  });

  it('sits below the anchor with a gap', () => {
    expect(resolvePlacement(ANCHOR, TOOLTIP, 'below', VIEWPORT)).toEqual({
      left: 410,
      top: 428,
      side: 'below',
    });
  });

  it('flips above to below when the top edge is in the way', () => {
    const placement = resolvePlacement(
      { ...ANCHOR, top: 4 },
      TOOLTIP,
      'above',
      VIEWPORT,
    );
    expect(placement.side).toBe('below');
    expect(placement.top).toBe(32);
  });

  it('flips below to above when the bottom edge is in the way', () => {
    const placement = resolvePlacement(
      { ...ANCHOR, top: 780 },
      TOOLTIP,
      'below',
      VIEWPORT,
    );
    expect(placement.side).toBe('above');
    expect(placement.top).toBe(748);
  });

  it('clamps against the right edge instead of overflowing', () => {
    const placement = resolvePlacement(
      { ...ANCHOR, left: 970, width: 20 },
      TOOLTIP,
      'above',
      VIEWPORT,
    );
    expect(placement.left).toBe(912);
  });

  it('clamps against the left edge instead of overflowing', () => {
    const placement = resolvePlacement(
      { ...ANCHOR, left: 0, width: 20 },
      TOOLTIP,
      'above',
      VIEWPORT,
    );
    expect(placement.left).toBe(8);
  });

  it('maps before to the left side and after to the right side', () => {
    expect(resolvePlacement(ANCHOR, TOOLTIP, 'before', VIEWPORT)).toEqual({
      left: 312,
      top: 398,
      side: 'left',
    });
    expect(resolvePlacement(ANCHOR, TOOLTIP, 'after', VIEWPORT)).toEqual({
      left: 508,
      top: 398,
      side: 'right',
    });
  });

  it('flips left to right when the left edge is in the way', () => {
    const placement = resolvePlacement(
      { ...ANCHOR, left: 10 },
      TOOLTIP,
      'left',
      VIEWPORT,
    );
    expect(placement.side).toBe('right');
    expect(placement.left).toBe(118);
  });

  it('keeps the requested side when neither side fits', () => {
    const placement = resolvePlacement(
      { top: 10, left: 400, width: 100, height: 20 },
      TOOLTIP,
      'above',
      { width: 1000, height: 40 },
    );
    expect(placement.side).toBe('above');
    expect(placement.top).toBe(8);
  });

  it('falls back to the margin when the tooltip outgrows the viewport', () => {
    const placement = resolvePlacement(
      ANCHOR,
      { width: 2000, height: 24 },
      'above',
      VIEWPORT,
    );
    expect(placement.left).toBe(8);
  });
});

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `
    <button id="plain" pdzTooltip="Undo">U</button>
    <button id="described" aria-describedby="hint" pdzTooltip="Redo">R</button>
    <button id="empty" [pdzTooltip]="''">E</button>
  `,
})
class HostComponent {}

describe('pdzTooltip', () => {
  let service: TooltipService;

  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const query = (id: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(
        `#${id}`,
      ) as HTMLElement;
    return { fixture, query };
  }

  function enter(element: HTMLElement) {
    element.dispatchEvent(new MouseEvent('mouseenter'));
  }

  function leave(element: HTMLElement) {
    element.dispatchEvent(new MouseEvent('mouseleave'));
  }

  beforeEach(() => {
    service = TestBed.inject(TooltipService);
  });

  afterEach(() => {
    service.dismiss();
  });

  it('waits for the show delay before becoming visible', fakeAsync(() => {
    const { query } = render();
    enter(query('plain'));
    expect(service.visible()).toBeNull();

    tick(150);
    expect(service.visible()?.content).toBe('Undo');
  }));

  it('ignores a trigger with no content', fakeAsync(() => {
    const { query } = render();
    enter(query('empty'));
    tick(150);
    expect(service.visible()).toBeNull();
  }));

  it('swaps instantly when moving between triggers', fakeAsync(() => {
    const { query } = render();
    enter(query('plain'));
    tick(150);

    leave(query('plain'));
    enter(query('described'));
    expect(service.visible()?.content).toBe('Redo');
  }));

  it('does not let a stale leave close the newer tooltip', fakeAsync(() => {
    const { query } = render();
    const plain = query('plain');
    enter(plain);
    tick(150);

    enter(query('described'));
    leave(plain);
    tick(200);

    expect(service.visible()?.content).toBe('Redo');
  }));

  it('points aria-describedby at the tooltip only while it is shown', fakeAsync(() => {
    const { fixture, query } = render();
    const plain = query('plain');
    expect(plain.hasAttribute('aria-describedby')).toBe(false);

    enter(plain);
    tick(150);
    fixture.detectChanges();
    expect(plain.getAttribute('aria-describedby')).toBe(TOOLTIP_ID);

    leave(plain);
    tick(200);
    fixture.detectChanges();
    expect(plain.hasAttribute('aria-describedby')).toBe(false);
  }));

  it('preserves an existing aria-describedby', fakeAsync(() => {
    const { fixture, query } = render();
    const described = query('described');
    expect(described.getAttribute('aria-describedby')).toBe('hint');

    enter(described);
    tick(150);
    fixture.detectChanges();
    expect(described.getAttribute('aria-describedby')).toBe(
      `hint ${TOOLTIP_ID}`,
    );
  }));

  it('closes on Escape', fakeAsync(() => {
    const { query } = render();
    enter(query('plain'));
    tick(150);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(service.visible()).toBeNull();
  }));
});
