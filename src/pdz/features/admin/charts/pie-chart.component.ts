import { DecimalPipe } from '@angular/common';
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

export interface PieDatum {
  label: string;
  value: number;
}

interface LegendRow extends PieDatum {
  color: string;
  percent: number;
}

const SIZE = 240;
const RADIUS = SIZE / 2;

const DEFAULT_COLORS = [
  'var(--pdz-color-primary)',
  'var(--pdz-color-secondary)',
  'var(--pdz-color-secondary-lighter)',
  'var(--pdz-color-secondary-darker)',
];

@Component({
  selector: 'pdz-pie-chart',
  imports: [DecimalPipe],
  template: `
    <div class="pie-host">
      <div class="pie-chart">
        <svg #svg [attr.viewBox]="'0 0 ' + size + ' ' + size"></svg>
      </div>
      <ul class="pie-legend">
        @for (row of legend; track row.label) {
          <li>
            <span class="swatch" [style.background]="row.color"></span>
            <span class="legend-label">{{ row.label }}</span>
            <span class="legend-value">
              {{ row.value | number }} · {{ row.percent | number: '1.0-1' }}%
            </span>
          </li>
        }
      </ul>
    </div>
  `,
  styleUrl: './pie-chart.component.scss',
})
export class PieChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  @Input() data: PieDatum[] = [];
  @Input() colors: string[] = DEFAULT_COLORS;
  @Input() centerLabel = 'total';

  readonly size = SIZE;
  legend: LegendRow[] = [];

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

  private colorFor(i: number): string {
    return this.colors[i % this.colors.length];
  }

  private render(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    svg.selectAll('*').remove();

    const rows = (this.data ?? []).filter((d) => d.value > 0);
    const total = d3.sum(rows, (d) => d.value);

    this.legend = rows.map((row, i) => ({
      ...row,
      color: this.colorFor(i),
      percent: total > 0 ? (row.value / total) * 100 : 0,
    }));

    if (total === 0) {
      svg
        .append('text')
        .attr('x', RADIUS)
        .attr('y', RADIUS)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--pdz-color-on-surface-variant)')
        .text('No data');
      return;
    }

    const g = svg
      .append('g')
      .attr('transform', `translate(${RADIUS},${RADIUS})`);

    const pie = d3
      .pie<PieDatum>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<PieDatum>>()
      .innerRadius(RADIUS * 0.62)
      .outerRadius(RADIUS - 2)
      .padAngle(0.015)
      .cornerRadius(2);

    const centerValue = g
      .append('text')
      .attr('class', 'pie-center-value')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .text(total.toLocaleString());

    const centerLabel = g
      .append('text')
      .attr('class', 'pie-center-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .text(this.centerLabel);

    g.selectAll('path.pie-slice')
      .data(pie(rows))
      .join('path')
      .attr('class', 'pie-slice')
      .attr('fill', (_, i) => this.colorFor(i))
      .attr('d', arc)
      .on('mouseover', (_event, d) => {
        const i = rows.indexOf(d.data);
        const pct = ((d.data.value / total) * 100).toFixed(1);
        centerValue.text(d.data.value.toLocaleString());
        centerLabel.text(`${d.data.label} · ${pct}%`);
        g.selectAll<SVGPathElement, d3.PieArcDatum<PieDatum>>('path.pie-slice')
          .attr('opacity', (_p, j) => (j === i ? 1 : 0.4));
      })
      .on('mouseleave', () => {
        centerValue.text(total.toLocaleString());
        centerLabel.text(this.centerLabel);
        g.selectAll('path.pie-slice').attr('opacity', 1);
      });
  }
}
