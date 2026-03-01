import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import * as d3 from 'd3';
import { ReplayPlayer } from '../replay.interface';

type DataType = {
  turn: number;
  damage: number;
  remaining: number;
};

@Component({
  selector: 'pdz-replay-chart',
  standalone: true,
  template: `<svg class="replay-chart__svg"></svg>`,
  styleUrl: './replay-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayChartComponent implements AfterViewInit, OnChanges {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly lineColors = [
    'var(--pdz-color-primary)',
    'var(--pdz-color-secondary)',
  ];
  private readonly axisColor = 'var(--pdz-color-on-surface)';
  private readonly gridColor = 'var(--pdz-color-outline-variant)';
  private isViewInitialized = false;

  private svg!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private graph!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private tooltipText!: d3.Selection<SVGTextElement, unknown, null, undefined>;

  @Input({ required: true }) data!: ReplayPlayer[];

  totalPercent = 100;

  private readonly margin = { top: 25, right: 25, bottom: 10, left: 85 };
  private readonly width = 500;
  private readonly height = 300;
  private readonly graphWidth =
    this.width - this.margin.left - this.margin.right;
  private readonly graphHeight =
    this.height - this.margin.top - this.margin.bottom;

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.renderChart();
  }

  ngOnChanges(_: SimpleChanges): void {
    if (this.isViewInitialized) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    this.clear();

    if (!this.data.length) {
      return;
    }

    const largestTeamSize = this.data.reduce(
      (maxTeamSize, player) => Math.max(maxTeamSize, player.team.length),
      0,
    );

    if (!largestTeamSize) {
      return;
    }

    this.totalPercent = largestTeamSize * 100;
    this.createSvg();
    this.createTooltip();
    this.drawLines(this.data);
    this.addLegend();
  }

  private clear(): void {
    d3.select(this.el.nativeElement).select('svg').selectAll('*').remove();
  }

  private createSvg(): void {
    this.svg = d3
      .select(this.el.nativeElement)
      .select('svg')
      .attr(
        'viewBox',
        `0 0 ${this.width + this.margin.left + this.margin.right} ${
          this.height + this.margin.top + this.margin.bottom
        }`,
      )
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.graph = this.svg.append('g');
  }

  private createTooltip(): void {
    this.tooltipText = this.svg
      .append('text')
      .attr('class', 'replay-chart__tooltip')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('fill', this.axisColor)
      .style('visibility', 'hidden');
  }

  private drawLines(data: ReplayPlayer[]): void {
    const linePad = 1;
    const min = 0;
    const max = linePad + this.totalPercent;
    const maxTurn = data.reduce((currentMax, player) => {
      const playerMaxTurn = player.turnChart.reduce(
        (turnMax, turnPoint) => Math.max(turnMax, turnPoint.turn),
        0,
      );

      return Math.max(currentMax, playerMaxTurn);
    }, 0);

    if (!maxTurn) {
      return;
    }

    const x = d3.scaleLinear().range([0, this.graphWidth]).domain([0, maxTurn]);

    const y = d3.scaleLinear().domain([min, max]).range([this.graphHeight, 0]);

    this.graph
      .append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(y.ticks())
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', this.graphWidth)
      .attr('y1', (d: number) => y(d))
      .attr('y2', (d: number) => y(d))
      .attr('stroke', this.gridColor)
      .attr('stroke-width', 0.5);

    this.graph
      .append('g')
      .attr('class', 'replay-chart__x-axis')
      .attr('transform', 'translate(0,' + this.graphHeight + ')')
      .call(d3.axisBottom(x));

    this.graph
      .append('text')
      .attr('class', 'replay-chart__axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', this.graphWidth / 2)
      .attr('y', this.graphHeight + this.margin.bottom + 25)
      .attr('fill', this.axisColor)
      .text('Turn');

    this.graph
      .append('g')
      .attr('class', 'replay-chart__y-axis')
      .call(d3.axisLeft(y).tickFormat((d) => `${d}%`));

    this.graph
      .append('text')
      .attr('class', 'replay-chart__axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.graphHeight / 2)
      .attr('y', -this.margin.left + 26)
      .attr('fill', this.axisColor)
      .text('Total HP (%)');

    const line = d3
      .line<DataType>()
      .x((d) => x(d.turn)!)
      .y((d) => y(this.totalPercent - d.damage));

    for (const [index, player] of data.entries()) {
      const strokeColor = this.lineColors[index] ?? this.axisColor;

      this.graph
        .append('path')
        .datum(player.turnChart)
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('d', line)
        .attr('stroke', strokeColor);

      this.graph
        .append('g')
        .selectAll('dot')
        .data(player.turnChart)
        .join('circle')
        .attr('cx', (d: DataType) => x(d.turn)!)
        .attr('cy', (d: DataType) => y(this.totalPercent - d.damage))
        .attr('r', 3)
        .attr('fill', strokeColor);
    }

    this.graph
      .selectAll<SVGCircleElement, DataType>('circle')
      .on('mouseover', (event: MouseEvent, d: DataType) => {
        const [xPosition, yPosition] = d3.pointer(event);
        this.tooltipText
          .attr('x', xPosition)
          .attr('y', yPosition - 10)
          .text(`${(this.totalPercent - d.damage).toFixed(2)}%`)
          .style('visibility', 'visible');
      })
      .on('mouseleave', () => {
        this.tooltipText.style('visibility', 'hidden');
      });
  }

  private addLegend(): void {
    const legend = this.svg
      .append('g')
      .attr('class', 'replay-chart__legend')
      .attr('transform', `translate(${this.graphWidth + 20}, 20)`);

    const legendItems = legend
      .selectAll('.replay-chart__legend-item')
      .data(this.data.map((d) => d.username))
      .enter()
      .append('g')
      .attr('class', 'replay-chart__legend-item')
      .attr(
        'transform',
        (_: string | undefined, i: number) => `translate(0, ${i * 20})`,
      );

    legendItems
      .append('rect')
      .attr('x', 0)
      .attr('width', 10)
      .attr('height', 10)
      .attr(
        'fill',
        (_: string | undefined, i: number) =>
          this.lineColors[i] ?? this.axisColor,
      );

    legendItems
      .append('text')
      .attr('x', 20)
      .attr('y', 5)
      .attr('dy', '0.35em')
      .attr('fill', this.axisColor)
      .attr('font-size', '12px')
      .text((d: string | undefined) => d ?? 'Unknown');
  }
}
