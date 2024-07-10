import { Component, ElementRef, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { ReplayPlayer } from '../replay.interface';

type DataType = {
  turn: number;
  damage: number;
};

@Component({
  selector: 'damage-chart',
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
export class DamageChartComponent implements OnInit {
  @Input()
  data!: ReplayPlayer[];

  @Input()
  monCount!: number;

  totalPercent = 100;

  svg: any;
  margin = { top: 10, right: 0, bottom: 20, left: 50 };
  width = 700;
  height = 400;
  graphWidth = this.width - this.margin.left - this.margin.right;
  graphHeight = this.height - this.margin.top - this.margin.bottom;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.totalPercent = this.data[0].team.length * 100;
    this.createSvg();
    this.createTooltip();
    this.drawLines(this.data);
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
  }

  createTooltip(): void {
    let rect = this.svg
      .append('rect')
      .attr('id', 'tooltip')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 3)
      .attr('fill', 'white')
      .attr('ry', 3)
      .attr('stroke-width', 1)
      .style('visibility', 'hidden');

    rect
      .append('text')
      .attr('id', 'tooltip')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('stroke', 'black')
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

    console.log(data);
    const x = d3
      .scaleBand()
      .range([0, this.graphWidth])
      .domain(data[0].turnChart.map((d) => d.turn.toString()))
      .padding(0.2);

    const y = d3.scaleLinear().domain([min, max]).range([this.graphHeight, 0]);

    // Add horizontal grid lines
    this.svg
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
    this.svg
      .append('g')
      .attr('transform', 'translate(0,' + this.graphHeight + ')')
      .call(d3.axisBottom(x));

    // Add the y Axis
    this.svg.append('g').call(d3.axisLeft(y).tickFormat((d) => d + '%'));

    const line = d3
      .line<DataType>()
      .x((d) => x(d.turn.toString())! + x.bandwidth() / 2)
      .y((d) => y(this.totalPercent - d.damage));

    let colors = ['aTeam-400', 'bTeam-400'];
    for (let i in data) {
      this.svg
        .append('path')
        .datum(data[i].turnChart)
        .attr('fill', 'none')
        .attr('class', `stroke-${colors[i]}`)
        .attr('stroke-width', 2)
        .attr('d', line);

      this.svg
        .append('g')
        .selectAll('dot')
        .data(data[i].turnChart)
        .join('line')
        .attr('x1', (d: DataType) => x(d.turn.toString())! + x.bandwidth() / 2)
        .attr('y1', (d: DataType) => y(this.totalPercent - d.damage))
        .attr('x2', (d: DataType) => x(d.turn.toString())! + x.bandwidth() / 2)
        .attr('y2', (d: DataType) => y(this.totalPercent - d.damage))
        .attr('stroke-width', 5)
        .attr('stroke-linecap', 'round')
        .attr('class', `stroke-${colors[i]}`);

      this.svg
        .selectAll('line')
        .on('mouseover', (event: MouseEvent, d: DataType) => {
          d3.select('#tooltip')
            .style('visibility', 'visible')
            .text(`${d.damage}%`);
        })
        .on('mousemove', (event: MouseEvent) => {
          d3.select('#tooltip')
            .attr('x', event.offsetX - this.margin.left)
            .attr('y', event.offsetY - this.margin.top);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('visibility', 'hidden');
        });
    }
  }
}
