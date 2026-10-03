import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
} from '@angular/core';
import * as d3 from 'd3';

type EffectivenessRow = {
  category: string;
  se: number;
  e: number;
  ne: number;
};

type Segment = 'se' | 'e' | 'ne';

const SEGMENTS: Segment[] = ['se', 'e', 'ne'];
const FILLS: Record<Segment, string> = {
  se: 'var(--pdz-color-positive)',
  e: 'var(--pdz-color-state-strong)',
  ne: 'var(--pdz-color-negative)',
};
const INKS: Record<Segment, string> = {
  se: 'var(--pdz-color-on-positive)',
  e: 'var(--pdz-color-on-surface)',
  ne: 'var(--pdz-color-on-negative)',
};
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 25;
const MIN_LABEL_WIDTH = 30;

@Component({
  selector: 'pdz-effectiveness-chart',
  template: `<svg role="img" aria-label="Move effectiveness breakdown"></svg>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectivenessChartComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly data = input<EffectivenessRow[]>([]);

  constructor() {
    afterRenderEffect(() => this.draw(this.data()));
  }

  private draw(data: EffectivenessRow[]): void {
    const svg = d3
      .select(this.host.nativeElement)
      .select('svg')
      .attr('viewBox', `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`);
    svg.selectAll('*').remove();
    if (!data.length) return;

    const x = d3.scaleLinear().domain([0, 1]).range([0, VIEW_WIDTH]);
    const y = d3
      .scaleBand()
      .domain(data.map((row) => row.category))
      .range([0, VIEW_HEIGHT]);
    const stacked = d3.stack<EffectivenessRow, Segment>().keys(SEGMENTS)(data);

    const groups = svg
      .append('g')
      .selectAll('g')
      .data(stacked)
      .join('g')
      .style('fill', (series) => FILLS[series.key]);

    groups
      .selectAll('rect')
      .data((series) => series)
      .join('rect')
      .attr('x', (point) => x(point[0]))
      .attr('y', (point) => y(point.data.category) ?? 0)
      .attr('width', (point) => x(point[1]) - x(point[0]))
      .attr('height', y.bandwidth());

    svg
      .append('g')
      .selectAll('g')
      .data(stacked)
      .join('g')
      .style('fill', (series) => INKS[series.key])
      .selectAll('text')
      .data((series) => series)
      .join('text')
      .attr('x', (point) => x(point[0]) + (x(point[1]) - x(point[0])) / 2)
      .attr(
        'y',
        (point) => (y(point.data.category) ?? 0) + y.bandwidth() / 2,
      )
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-weight', '700')
      .text((point) =>
        x(point[1]) - x(point[0]) < MIN_LABEL_WIDTH
          ? ''
          : `${((point[1] - point[0]) * 100).toFixed()}%`,
      );
  }
}
