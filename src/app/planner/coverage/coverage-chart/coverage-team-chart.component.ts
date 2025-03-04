//@ts-nocheck
import { Component, ElementRef, Input, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import {
  CoverageMax,
  CoveragePokemon,
} from '../../../drafts/matchup-overview/matchup-interface';
import { TYPES } from '../../../data';

type ChartData = CoverageMax;

@Component({
  selector: 'coverage-team-chart',
  standalone: true,
  template: '<svg></svg>',
  imports: [],
})
export class CoverageTeamChartComponent implements OnDestroy {
  @Input()
  set data(data: CoveragePokemon[]) {
    this.updateData(data);
  }

  @Input()
  set maxPower(value: number) {
    this._maxPower = value;
    this.updateData();
  }

  get maxPower() {
    return this._maxPower;
  }

  private _maxPower!: number;
  private chartData!: ChartData;
  private rawData!: CoveragePokemon[];
  private svg;
  private chartGroup;
  private xScale;
  private yScale;
  private color;
  private margin = { top: 50, right: 50, bottom: 50, left: 50 };
  private width = 800;
  private height = 400;

  constructor(private el: ElementRef) {}

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private initializeChart(): void {
    this.svg = d3
      .select(this.el.nativeElement)
      .select('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .attr('viewBox', [
        0,
        0,
        this.width + this.margin.left + this.margin.right,
        this.height + this.margin.top + this.margin.bottom,
      ])
      .style('max-width', '100%')
      .style('height', 'auto');

    this.chartGroup = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.chartGroup.append('g').attr('class', 'x-axis');

    this.chartGroup.append('g').attr('class', 'y-axis');

    this.color = d3
      .scaleOrdinal()
      .domain(['physical', 'special'])
      .range(['#EF6845', '#61ADF3']);
  }

  private updateData(data: CoveragePokemon[] = this.rawData) {
    if (!this.svg) {
      this.initializeChart();
    }

    this.rawData = data;
    this.chartData = TYPES.flatMap((type) => [
      {
        type,
        category: 'physical',
        value: data.reduce(
          (sum, mon) =>
            sum +
            (mon.fullcoverage.physical[type] &&
            mon.fullcoverage.physical[type].some(
              (move) => +move.basePower >= this.maxPower,
            )
              ? 1
              : 0),
          0,
        ),
      },
      {
        type,
        category: 'special',
        value: data.reduce(
          (sum, mon) =>
            sum +
            (mon.fullcoverage.special[type] &&
            mon.fullcoverage.special[type].some(
              (move) => +move.basePower >= this.maxPower,
            )
              ? 1
              : 0),
          0,
        ),
      },
    ]);

    this.updateChart();
  }

  private updateChart(): void {
    const categories = ['physical', 'special'];

    const groupedData = d3.groups(this.chartData, (d) => d.type);
    groupedData.sort(
      (a, b) => d3.sum(b[1], (d) => d.value) - d3.sum(a[1], (d) => d.value),
    );

    const stackedData = groupedData.map(([type, values]) => {
      const entry: any = { type };
      values.forEach((d) => (entry[d.category] = d.value));
      return entry;
    });

    this.xScale = d3
      .scaleBand()
      .domain(groupedData.map((d) => d[0]))
      .range([this.margin.left, this.width - this.margin.right])
      .padding(0.2);

    this.yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(stackedData, (d) => d3.sum(categories, (c) => d[c])) || 1,
      ])
      .nice()
      .range([this.height - this.margin.bottom, this.margin.top]);

    const stack = d3.stack().keys(categories);
    const series = stack(stackedData);

    const groups = this.chartGroup
      .selectAll('.stack')
      .data(series)
      .join('g')
      .attr('class', 'stack')
      .attr('fill', (d) => this.color(d.key));

    const rects = groups.selectAll('rect').data((d) => d);

    rects
      .enter()
      .append('rect')
      .attr('x', (d) => this.xScale(d.data.type)!)
      .attr('y', this.yScale(0))
      .attr('height', 0)
      .attr('width', this.xScale.bandwidth())
      .merge(rects)
      .transition()
      .duration(500)
      .attr('y', (d) => this.yScale(d[1]))
      .attr('height', (d) => this.yScale(d[0]) - this.yScale(d[1]));

    rects
      .exit()
      .transition()
      .duration(500)
      .attr('y', this.yScale(0))
      .attr('height', 0)
      .remove();

    // Remove existing axis labels but keep the transition on the axis itself
    this.chartGroup
      .select('.x-axis')
      .transition()
      .duration(500)
      .attr('transform', `translate(0,${this.height - this.margin.bottom})`)
      .call(d3.axisBottom(this.xScale).tickSizeOuter(0)) // Keep the transition
      .selection()
      .selectAll('text') // Select text elements
      .style('opacity', 0); // Hide the text labels instead of removing them

    // Update images with transition
    const images = this.chartGroup
      .select('.x-axis')
      .selectAll('image')
      .data(groupedData, (d) => d[0]); // Use type as key for proper update pattern

    images.join(
      (enter) =>
        enter
          .append('image')
          .attr('x', (d) => this.xScale(d[0])! + this.xScale.bandwidth() / 4)
          .attr('y', this.xScale.bandwidth() / 4)
          .attr('width', this.xScale.bandwidth() / 2)
          .attr('height', this.xScale.bandwidth() / 2)
          .attr(
            'href',
            (d) => `../../../../assets/icons/types/gen9full/${d[0]}.png`,
          )
          .style('opacity', 0)
          .call((enter) => enter.transition().duration(500).style('opacity', 1))
          .style('opacity', 1),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(500)
            .attr('x', (d) => this.xScale(d[0])! + this.xScale.bandwidth() / 4)
            .attr('y', this.xScale.bandwidth() / 4),
        ),
      (exit) =>
        exit.call((exit) =>
          exit.transition().duration(500).style('opacity', 0).remove(),
        ),
    );

    this.chartGroup
      .select('.y-axis')
      .transition()
      .duration(500)
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yScale).ticks(null, 's'));
  }

  private destroyChart(): void {
    if (this.svg) {
      this.svg.selectAll('*').remove();
    }
    d3.select(this.el.nativeElement).select('svg').on('.zoom', null);
  }
}
