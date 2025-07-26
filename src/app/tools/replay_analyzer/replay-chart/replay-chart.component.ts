import { Component, ElementRef, Input, OnInit, inject } from '@angular/core';
import * as d3 from 'd3';
import { ReplayPlayer } from '../replay.interface';

type DataType = {
  turn: number;
  damage: number;
  remaining: number;
};

@Component({
  selector: 'replay-chart',
  standalone: true,
  template: `<svg></svg>`,
  styles: `
  .fill-0 {
    fill: var(--twc-aTeam-400)
  }
  .fill-1{
    fill: var(--twc-bTeam-400)
  }
  `,
})
export class ReplayChartComponent implements OnInit {
  private el = inject(ElementRef);

  @Input()
  data!: ReplayPlayer[];

  @Input()
  monCount!: number;

  totalPercent = 100;

  svg: any;
  graph: any;
  margin = { top: 25, right: 40, bottom: 10, left: 60 };
  width = 500;
  height = 300;
  graphWidth = this.width - this.margin.left - this.margin.right;
  graphHeight = this.height - this.margin.top - this.margin.bottom;

  ngOnInit(): void {
    this.totalPercent = this.data[0].team.length * 100;
    this.createSvg();
    this.createTooltip();
    this.drawLines(this.data);
    this.addLegend();
  }

  ngOnChanges(): void {
    if(this.svg || this.graph) {
      this.clear();
      this.totalPercent = this.data[0].team.length * 100;
      this.createSvg();
      this.createTooltip();
      this.drawLines(this.data);
      this.addLegend(); 
    }
  }

  clear(): void {
    this.svg.selectAll('*').remove();
    this.graph.selectAll('*').remove();
  }

  createSvg(): void {
    this.svg = d3
      .select(this.el.nativeElement)
      .select('svg')
      .attr(
        'viewBox',
        `0 0 ${this.width + this.margin.left + this.margin.right} ${
          this.height + this.margin.top + this.margin.bottom
        }`
      )
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.graph = this.svg.append('g');
  }

  createTooltip(): void {
    this.svg
      .append('text')
      .attr('id', 'tooltip-text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '12px')
      .style('visibility', 'hidden');
  }

  drawLines(data: ReplayPlayer[]): void {
    // Create the x and y scales
    const linePad = 1;
    const min = 0;
    const max =
      linePad +
      data.reduce(
        (max, player) =>
          (max = player.team.length > max ? player.team.length : max),
        0
      ) *
        100;

    const x = d3
      .scaleLinear()
      .range([0, this.graphWidth])
      .domain([
        0,
        data.reduce(
          (max, player) =>
            (max =
              player.turnChart[player.turnChart.length - 1].turn > max
                ? player.turnChart[player.turnChart.length - 1].turn
                : max),
          0
        ),
      ]);

    const y = d3.scaleLinear().domain([min, max]).range([this.graphHeight, 0]);

    // Add horizontal grid lines
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
      .attr('stroke', 'lightgrey')
      .attr('stroke-width', 0.5);

    // Add the x Axis
    this.graph
      .append('g')
      .attr('transform', 'translate(0,' + this.graphHeight + ')')
      .call(d3.axisBottom(x));

    // Add x-axis label
    this.graph
      .append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', this.graphWidth / 2)
      .attr('y', this.graphHeight + this.margin.bottom + 25) // Adjusted position
      .text('Turn');

    // Add the y Axis
    this.graph.append('g').call(d3.axisLeft(y).tickFormat((d) => d + '%'));

    // Add y-axis label
    this.graph
      .append('text')
      .attr('class', 'y-axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.graphHeight / 2)
      .attr('y', -this.margin.left + 20) // Adjusted position
      .text('Total HP (%)');

    const line = d3
      .line<DataType>()
      .x((d) => x(d.turn)!)
      .y((d) => y(this.totalPercent - d.damage));

    let colors = ['#06b6d4', '#EE6717'];
    for (let i in data) {
      this.graph
        .append('path')
        .datum(data[i].turnChart)
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('d', line)
        .attr('stroke', `${colors[i]}`);

      this.graph
        .append('g')
        .selectAll('dot')
        .data(data[i].turnChart)
        .join('circle')
        .attr('cx', (d: DataType) => x(d.turn)!)
        .attr('cy', (d: DataType) => y(this.totalPercent - d.damage))
        .attr('r', 3)
        .attr('fill', `${colors[i]}`);
    }
    const tooltipText = d3.select('#tooltip-text');

    this.graph
      .selectAll('circle')
      .on('mouseover', (event: MouseEvent, d: DataType) => {
        const [xPosition, yPosition] = d3.pointer(event);
        tooltipText
          .attr('x', xPosition)
          .attr('y', yPosition - 10)
          .text(`${(this.totalPercent - d.damage).toFixed(2)}%`)
          .style('visibility', 'visible');
      })
      .on('mouseleave', () => {
        tooltipText.style('visibility', 'hidden');
      });
  }
  addLegend(): void {
    const legend = this.svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.graphWidth + 20}, 20)`);

    const legendItems = legend
      .selectAll('.legend-item')
      .data(this.data.map((d) => d.username))
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d: any, i: number) => `translate(0, ${i * 20})`);

    legendItems
      .append('rect')
      .attr('x', 0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', (d: any, i: number) => ['#06b6d4', '#EE6717'][i]);

    legendItems
      .append('text')
      .attr('x', 20)
      .attr('y', 5)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .text((d: any) => d);
  }

  filterTicks(maxTicks: number): number[] {
    const desiredTickCount = 20; // Adjust as needed
    const step = Math.ceil(maxTicks / desiredTickCount);
    return Array.from(
      { length: Math.ceil(maxTicks / step) },
      (_, i) => i * step
    );
  }
}
