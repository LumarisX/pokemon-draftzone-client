import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Wire } from '../wire-routing';

/** Largest radius applied to a polyline corner. */
const CORNER_RADIUS = 6;

/**
 * Draws the connector wires on a canvas sitting behind the match cards.
 *
 * The cards are DOM — this layer only paints lines between rectangles it is
 * told about, and never receives pointer events, so it costs nothing to
 * redraw on every layout change.
 */
@Component({
  selector: 'pdz-stage-wires',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="wires" aria-hidden="true"></canvas>`,
  styles: [
    `
      :host {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .wires {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class StageWiresComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) wires: Wire[] = [];
  /** CSS-pixel size of the grid this layer covers. */
  @Input({ required: true }) width = 0;
  @Input({ required: true }) height = 0;

  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private observer?: ResizeObserver;

  ngAfterViewInit(): void {
    this.draw();
    // Device pixel ratio can change when a window moves between displays.
    this.observer = new ResizeObserver(() => this.draw());
    if (this.canvasRef) this.observer.observe(this.canvasRef.nativeElement);
  }

  ngOnChanges(): void {
    this.draw();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, this.width);
    const height = Math.max(1, this.height);
    if (canvas.width !== Math.round(width * dpr)) {
      canvas.width = Math.round(width * dpr);
    }
    if (canvas.height !== Math.round(height * dpr)) {
      canvas.height = Math.round(height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Read the palette off the host so the lines follow the active theme.
    const styles = getComputedStyle(canvas);
    const colorFor = (token: string, fallback: string) =>
      styles.getPropertyValue(`--pdz-color-${token}`).trim() || fallback;
    const winner = colorFor('positive', '#2e7d32');
    const loser = colorFor('negative', '#c62828');

    for (const wire of this.wires) {
      ctx.strokeStyle = wire.cls === 'winner' ? winner : loser;
      ctx.lineWidth = wire.decided ? 2 : 1.5;
      // An undecided line is provisional: the match it carries hasn't been
      // played, so it is drawn dashed rather than solid.
      ctx.setLineDash(wire.decided ? [] : [4, 4]);
      tracePolyline(ctx, wire.points);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
}

/** Traces an orthogonal polyline, rounding each corner it turns. */
export function tracePolyline(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
): void {
  ctx.beginPath();
  if (points.length < 2) return;

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const point = points[i];
    const next = points[i + 1];
    const inLength = Math.hypot(point.x - prev.x, point.y - prev.y);
    const outLength = Math.hypot(next.x - point.x, next.y - point.y);
    const radius = Math.min(CORNER_RADIUS, inLength / 2, outLength / 2);

    // Segments too short to round get a plain corner.
    if (radius < 0.5) {
      ctx.lineTo(point.x, point.y);
      continue;
    }
    ctx.lineTo(
      point.x - ((point.x - prev.x) / inLength) * radius,
      point.y - ((point.y - prev.y) / inLength) * radius,
    );
    ctx.quadraticCurveTo(
      point.x,
      point.y,
      point.x + ((next.x - point.x) / outLength) * radius,
      point.y + ((next.y - point.y) / outLength) * radius,
    );
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}
