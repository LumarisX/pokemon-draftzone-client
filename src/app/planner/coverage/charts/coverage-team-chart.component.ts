//@ts-nocheck
import { Component, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import * as d3 from 'd3';
import {
  CoverageMax,
  CoveragePokemon,
} from '../../../drafts/matchup-overview/matchup-interface';
import { Type, TYPES } from '../../../data';

type TeamData = {
  type: Type;
  value: number;
}[];

type ChartData = {
  color: string;
  teamData: TeamData;
};

@Component({
  selector: 'coverage-team-chart',
  standalone: true,
  template: '<svg></svg>',
  imports: [],
})
export class CoverageTeamChartComponent implements OnDestroy {
  private el = inject(ElementRef);

  @Input()
  set data(value: ChartData) {
    if (value) this.updateData(value);
  }

  color: string = '#EF6845';

  private chartData!: TeamData;
  private svg;
  private chartGroup;
  private xScale;
  private yScale;
  private margin = { top: 5, right: 5, bottom: 20, left: 10 };
  private width = 600;
  private height = 300;

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private updateData(data: ChartData) {
    this.chartData = [...data.teamData].sort((a, b) => b.value - a.value);
    this.color = data.color;
    if (!this.svg) {
      this.initializeChart();
    }

    this.updateChart();
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

    // **Initialize the scales**
    this.xScale = d3
      .scaleBand()
      .range([this.margin.left, this.width - this.margin.right])
      .padding(0.2);
    this.yScale = d3
      .scaleLinear()
      .range([this.height - this.margin.bottom, this.margin.top]);
  }

  private updateChart(): void {
    const filteredData = this.chartData;
    filteredData.sort((a, b) => b.value - a.value);

    // Update scales
    this.xScale.domain(filteredData.map((d) => d.type));
    this.yScale.domain([0, d3.max(filteredData, (d) => d.value) || 1]);

    const bars = this.chartGroup
      .selectAll('.bar')
      .data(filteredData, (d) => d.type);

    bars.join(
      (enter) =>
        enter
          .append('rect')
          .attr('class', 'bar')
          .attr('x', (d) => this.xScale(d.type)!)
          .attr('y', this.yScale(0))
          .attr('width', this.xScale.bandwidth())
          .attr('height', 0)
          .attr('fill', this.color)
          .attr('rx', 10)
          .attr('ry', 10)
          .call((enter) =>
            enter
              .transition()
              .duration(500)
              .attr('y', (d) => this.yScale(d.value))
              .attr('height', (d) => this.yScale(0) - this.yScale(d.value)),
          ),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(500)
            .attr('x', (d) => this.xScale(d.type)!)
            .attr('y', (d) => this.yScale(d.value))
            .attr('width', this.xScale.bandwidth())
            .attr('height', (d) => this.yScale(0) - this.yScale(d.value))
            .attr('fill', this.color)
            .attr('rx', 10)
            .attr('ry', 10),
        ),
      (exit) =>
        exit
          .transition()
          .duration(500)
          .attr('y', this.yScale(0))
          .attr('height', 0)
          .remove(),
    );

    // Update x-axis
    this.chartGroup
      .select('.x-axis')
      .transition()
      .duration(500)
      .attr('transform', `translate(0,${this.height - this.margin.bottom})`)
      .call(d3.axisBottom(this.xScale).tickSizeOuter(0))
      .selection()
      .selectAll('text') // Select text elements
      .style('opacity', 0); // Hide the text labels instead of removing them

    // Update y-axis
    this.chartGroup
      .select('.y-axis')
      .transition()
      .duration(500)
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(
        d3
          .axisLeft(this.yScale)
          .ticks(Math.min(5, d3.max(filteredData, (d) => d.value) || 1))
          .tickFormat(d3.format('d')),
      );

    // === ICONS ON X-AXIS ===
    const images = this.chartGroup
      .select('.x-axis')
      .selectAll('image')
      .data(filteredData, (d) => d.type); // Match icons to types

    images.join(
      (enter) =>
        enter
          .append('image')
          .attr('x', (d) => this.xScale(d.type)!)
          .attr('y', 10) // Slightly below axis
          .attr('width', this.xScale.bandwidth())
          .attr('height', this.xScale.bandwidth())
          .attr(
            'href',
            (d) => `../../../../assets/icons/types/gen9full/${d.type}.png`,
          ),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(500)
            .attr('x', (d) => this.xScale(d.type)!)
            .attr('y', 10),
        ),
    );
  }

  private destroyChart(): void {
    if (this.svg) {
      this.svg.selectAll('*').remove();
    }
    d3.select(this.el.nativeElement).select('svg').on('.zoom', null);
  }
}
