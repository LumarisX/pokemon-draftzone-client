import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';

export interface SeriesPoint {
  date: string;
  count: number;
}

interface ChartPoint {
  date: Date;
  count: number;
}

type BucketUnit = 'day' | 'week' | 'month';
type TrendKind =
  | 'none'
  | 'linear'
  | 'exponential'
  | 'polynomial'
  | 'movingAverage';

const WIDTH = 760;
const HEIGHT = 300;
const MARGIN = { top: 16, right: 20, bottom: 36, left: 48 };

@Component({
  selector: 'pdz-time-series-chart',
  template: `
    <div class="chart-host">
      <svg #svg [attr.viewBox]="'0 0 ' + width + ' ' + height"></svg>
      <div #tooltip class="ts-tooltip" hidden></div>
    </div>
  `,
  styleUrl: './time-series-chart.component.scss',
})
export class TimeSeriesChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('tooltip', { static: true })
  tooltipRef!: ElementRef<HTMLDivElement>;

  @Input() data: SeriesPoint[] = [];
  @Input() type: 'line' | 'bar' = 'line';
  @Input() bucket: BucketUnit = 'day';
  /** A CSS color or variable for the primary series. */
  @Input() color = 'var(--pdz-color-primary)';
  /** A CSS color or variable for the (secondary) trendline. */
  @Input() trendColor = 'var(--pdz-color-secondary)';
  /** Fit a trendline through the data. */
  @Input() trend: TrendKind = 'none';
  /** Degree used when `trend === 'polynomial'`. */
  @Input() trendDegree = 3;
  /** Window size (in buckets) used when `trend === 'movingAverage'`. */
  @Input() trendWindow = 4;
  @Input() valueLabel = 'Users';

  // `width` tracks the container so the chart fills its card at a constant
  // height instead of scaling its height up on very wide layouts.
  width = WIDTH;
  readonly height = HEIGHT;

  private viewReady = false;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.viewReady = true;
    const host = this.svgRef.nativeElement.parentElement as HTMLElement;
    this.resizeObserver = new ResizeObserver(() => {
      const w = Math.round(host.clientWidth);
      if (w > 0 && w !== this.width) {
        this.width = w;
        this.render();
      }
    });
    this.resizeObserver.observe(host);
    if (host.clientWidth > 0) this.width = Math.round(host.clientWidth);
    this.render();
  }

  ngOnChanges(): void {
    if (this.viewReady) this.render();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    d3.select(this.svgRef.nativeElement).selectAll('*').remove();
  }

  private render(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    // Keep the viewBox in sync with the measured width here: ResizeObserver
    // fires outside Angular, so the template binding may not have updated yet.
    svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
    svg.selectAll('*').remove();

    const points: ChartPoint[] = (this.data ?? [])
      .map((d) => ({ date: new Date(d.date), count: d.count }))
      .filter((d) => !isNaN(d.date.getTime()));

    if (points.length === 0) {
      svg
        .append('text')
        .attr('x', this.width / 2)
        .attr('y', HEIGHT / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--pdz-color-on-surface-variant)')
        .text('No data');
      return;
    }

    const innerW = this.width - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(points, (d) => d.date) as [Date, Date])
      .range([0, innerW]);

    const trendValues =
      this.trend === 'none'
        ? []
        : fitTrend(points, this.trend, this.trendDegree, this.trendWindow);

    const maxCount = Math.max(
      d3.max(points, (d) => d.count) ?? 0,
      d3.max(trendValues) ?? 0,
    );
    const y = d3
      .scaleLinear()
      .domain([0, maxCount === 0 ? 1 : maxCount])
      .nice()
      .range([innerH, 0]);

    // Axes.
    const tickFormat = this.axisFormat();
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .attr('class', 'ts-axis')
      .call(
        d3
          .axisBottom<Date>(x)
          .ticks(Math.min(8, points.length))
          .tickFormat((d) => tickFormat(d as Date)),
      );

    g.append('g')
      .attr('class', 'ts-axis')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
      .call((sel) =>
        sel
          .selectAll('.tick line')
          .clone()
          .attr('x2', innerW)
          .attr('class', 'ts-gridline'),
      );

    if (this.type === 'line') {
      this.renderLine(g, points, x, y, innerH);
    } else {
      this.renderBars(g, points, x, y, innerH);
    }

    if (trendValues.length) {
      this.renderTrend(g, points, trendValues, x, y);
    }

    this.attachHover(g, points, x, y, innerW, innerH);
  }

  private renderLine(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: ChartPoint[],
    x: d3.ScaleTime<number, number>,
    y: d3.ScaleLinear<number, number>,
    innerH: number,
  ): void {
    const area = d3
      .area<ChartPoint>()
      .x((d) => x(d.date))
      .y0(innerH)
      .y1((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<ChartPoint>()
      .x((d) => x(d.date))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(points)
      .attr('fill', this.color)
      .attr('fill-opacity', 0.12)
      .attr('d', area);

    g.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', this.color)
      .attr('stroke-width', 2)
      .attr('d', line);
  }

  private renderBars(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: ChartPoint[],
    x: d3.ScaleTime<number, number>,
    y: d3.ScaleLinear<number, number>,
    innerH: number,
  ): void {
    const step = points.length > 1 ? x(points[1].date) - x(points[0].date) : 24;
    const barW = Math.max(1, Math.min(28, step * 0.7));

    g.selectAll('rect.ts-bar')
      .data(points)
      .join('rect')
      .attr('class', 'ts-bar')
      .attr('x', (d) => x(d.date) - barW / 2)
      .attr('y', (d) => y(d.count))
      .attr('width', barW)
      .attr('height', (d) => innerH - y(d.count))
      .attr('fill', this.color)
      .attr('rx', 1);
  }

  private renderTrend(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: ChartPoint[],
    trendValues: number[],
    x: d3.ScaleTime<number, number>,
    y: d3.ScaleLinear<number, number>,
  ): void {
    const trendLine = d3
      .line<number>()
      .x((_, i) => x(points[i].date))
      .y((v) => y(Math.max(0, v)))
      .curve(d3.curveBasis);

    g.append('path')
      .datum(trendValues)
      .attr('class', 'ts-trend')
      .attr('fill', 'none')
      .attr('stroke', this.trendColor)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.45)
      .attr('stroke-dasharray', '6 4')
      .attr('stroke-linecap', 'round')
      .attr('d', trendLine);
  }

  private attachHover(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: ChartPoint[],
    x: d3.ScaleTime<number, number>,
    y: d3.ScaleLinear<number, number>,
    innerW: number,
    innerH: number,
  ): void {
    const tooltip = this.tooltipRef.nativeElement;
    const host = this.svgRef.nativeElement.parentElement as HTMLElement;
    const fullFormat = d3.timeFormat(
      this.bucket === 'month' ? '%B %Y' : '%b %d, %Y',
    );
    const bisect = d3.bisector<ChartPoint, Date>((d) => d.date).center;

    const focus = g.append('circle').attr('class', 'ts-focus').attr('r', 4);
    focus.attr('display', 'none');

    g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event, g.node());
        const date = x.invert(mx);
        const point = points[bisect(points, date)];
        if (!point) return;

        if (this.type === 'line') {
          focus
            .attr('display', null)
            .attr('cx', x(point.date))
            .attr('cy', y(point.count))
            .attr('fill', this.color);
        }

        const hostRect = host.getBoundingClientRect();
        const scale = hostRect.width / this.width;
        const px = (MARGIN.left + x(point.date)) * scale;
        const py = (MARGIN.top + y(point.count)) * scale;

        tooltip.hidden = false;
        tooltip.innerHTML = `<strong>${point.count.toLocaleString()}</strong> ${
          this.valueLabel
        }<br><span class="ts-tooltip-date">${fullFormat(point.date)}</span>`;
        tooltip.style.left = `${px}px`;
        tooltip.style.top = `${py}px`;
      })
      .on('mouseleave', () => {
        focus.attr('display', 'none');
        tooltip.hidden = true;
      });
  }

  private axisFormat(): (d: Date) => string {
    if (this.bucket === 'month') return d3.timeFormat('%b %Y');
    return d3.timeFormat('%b %d');
  }
}

/**
 * Returns a predicted value for each point using a least-squares fit against
 * the point index (0..n-1).
 *
 * - `linear` fits `y = m·x + c`.
 * - `polynomial` fits a degree-`degree` curve — a good general choice for
 *   cumulative growth that accelerates then decelerates, since it follows the
 *   actual shape over the observed range rather than extrapolating a constant
 *   rate.
 * - `exponential` fits `y = a·e^(b·x)` by regressing on `ln(y)`. Note this
 *   overweights small early values, so it overshoots decelerating data.
 */
function fitTrend(
  points: ChartPoint[],
  kind: TrendKind,
  degree = 3,
  window = 4,
): number[] {
  const n = points.length;
  if (n < 2) return [];

  if (kind === 'movingAverage') {
    const half = Math.max(1, Math.floor(window / 2));
    return points.map((_, i) => {
      const lo = Math.max(0, i - half);
      const hi = Math.min(n - 1, i + half);
      return d3.mean(points.slice(lo, hi + 1), (p) => p.count) ?? 0;
    });
  }

  if (kind === 'exponential') {
    const usable = points
      .map((p, i) => ({ i, ly: Math.log(p.count) }))
      .filter((p) => Number.isFinite(p.ly));
    if (usable.length < 2) return fitTrend(points, 'linear');

    const { slope, intercept } = leastSquares(
      usable.map((p) => p.i),
      usable.map((p) => p.ly),
    );
    return points.map((_, i) => Math.exp(intercept + slope * i));
  }

  if (kind === 'polynomial') {
    // Normalize x to [0, 1] for numerical stability, then solve the normal
    // equations for the polynomial coefficients.
    const deg = Math.max(1, Math.min(degree, n - 1));
    const xs = points.map((_, i) => i / (n - 1));
    const coeffs = polyfit(
      xs,
      points.map((p) => p.count),
      deg,
    );
    if (!coeffs) return fitTrend(points, 'linear');
    return xs.map((x) => polyval(coeffs, x));
  }

  const { slope, intercept } = leastSquares(
    points.map((_, i) => i),
    points.map((p) => p.count),
  );
  return points.map((_, i) => intercept + slope * i);
}

/** Least-squares polynomial fit via the normal equations. */
function polyfit(xs: number[], ys: number[], degree: number): number[] | null {
  const cols = degree + 1;
  // Powers of x up to 2*degree for the normal-equation matrix.
  const sumsX: number[] = new Array(2 * degree + 1).fill(0);
  for (const x of xs) {
    let p = 1;
    for (let k = 0; k < sumsX.length; k++) {
      sumsX[k] += p;
      p *= x;
    }
  }
  const sumsXY: number[] = new Array(cols).fill(0);
  xs.forEach((x, idx) => {
    let p = 1;
    for (let k = 0; k < cols; k++) {
      sumsXY[k] += p * ys[idx];
      p *= x;
    }
  });

  const a: number[][] = [];
  for (let r = 0; r < cols; r++) {
    a.push(sumsX.slice(r, r + cols).concat(sumsXY[r]));
  }
  return gaussianSolve(a);
}

function polyval(coeffs: number[], x: number): number {
  return coeffs.reduce((acc, c, i) => acc + c * Math.pow(x, i), 0);
}

/** Solves an augmented [n x (n+1)] system with partial pivoting. */
function gaussianSolve(m: number[][]): number[] | null {
  const n = m.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

function leastSquares(
  xs: number[],
  ys: number[],
): { slope: number; intercept: number } {
  const n = xs.length;
  const sumX = d3.sum(xs);
  const sumY = d3.sum(ys);
  const sumXY = d3.sum(xs.map((x, i) => x * ys[i]));
  const sumXX = d3.sum(xs.map((x) => x * x));
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}
