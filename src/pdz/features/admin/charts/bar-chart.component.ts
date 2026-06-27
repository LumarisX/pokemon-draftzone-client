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

export interface BarDatum {
  label: string;
  value: number;
}

const WIDTH = 360;
const ROW_HEIGHT = 30;
const MARGIN = { top: 6, right: 44, bottom: 6, left: 104 };

@Component({
  selector: 'pdz-bar-chart',
  template: `
    <div class="bar-host">
      <svg #svg [attr.viewBox]="'0 0 ' + width + ' ' + height"></svg>
    </div>
  `,
  styleUrl: './bar-chart.component.scss',
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  @Input() data: BarDatum[] = [];
  @Input() color = 'var(--pdz-color-primary)';

  readonly width = WIDTH;
  height = ROW_HEIGHT * 4 + MARGIN.top + MARGIN.bottom;

  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(): void {
    if (this.viewReady) this.render();
  }

  ngOnDestroy(): void {
    d3.select(this.svgRef.nativeElement).selectAll('*').remove();
  }

  private render(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    svg.selectAll('*').remove();

    const rows = this.data ?? [];
    this.height = Math.max(1, rows.length) * ROW_HEIGHT + MARGIN.top + MARGIN.bottom;

    if (rows.length === 0) {
      svg
        .append('text')
        .attr('x', WIDTH / 2)
        .attr('y', this.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--pdz-color-on-surface-variant)')
        .text('No data');
      return;
    }

    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = rows.length * ROW_HEIGHT;
    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(rows, (d) => d.value) || 1])
      .range([0, innerW]);

    const y = d3
      .scaleBand()
      .domain(rows.map((d) => d.label))
      .range([0, innerH])
      .padding(0.28);

    // Category labels.
    g.append('g')
      .attr('class', 'bar-labels')
      .selectAll('text')
      .data(rows)
      .join('text')
      .attr('x', -10)
      .attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .text((d) => d.label);

    // Bars.
    g.selectAll('rect.bar')
      .data(rows)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d) => y(d.label) ?? 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => Math.max(0, x(d.value)))
      .attr('fill', this.color)
      .attr('rx', 2);

    // Value labels at the end of each bar.
    g.append('g')
      .attr('class', 'bar-values')
      .selectAll('text')
      .data(rows)
      .join('text')
      .attr('x', (d) => x(d.value) + 6)
      .attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.32em')
      .text((d) => d.value.toLocaleString());
  }
}
