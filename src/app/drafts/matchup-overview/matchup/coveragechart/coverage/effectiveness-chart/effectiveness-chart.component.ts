import { Component, OnInit, ElementRef, Input, OnChanges, inject } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'effectiveness-chart',
  standalone: true,
  template: `<svg></svg>`,
})
export class EffectivenessChartComponent implements OnInit, OnChanges {
  private el = inject(ElementRef);

  @Input('data') data: {
    category: string;
    se: number;
    e: number;
    ne: number;
  }[] = [];
  svg: any;
  margin = { top: 0, right: 0, bottom: 0, left: 0 };
  padding = 0;
  viewBoxWidth = 200;
  viewBoxHeight = 25;
  ngOnInit(): void {
    this.createSvg();
    this.drawBars(this.data);
  }

  ngOnChanges(): void {
    if (this.svg) this.drawBars(this.data);
  }

  createSvg(): void {
    this.svg = d3
      .select(this.el.nativeElement)
      .select('svg')
      .attr('viewBox', `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  drawBars(
    data: {
      category: string;
      se: number;
      e: number;
      ne: number;
    }[],
  ): void {
    const subgroups = Object.keys(data[0]).slice(1);
    const groups = data.map((d) => d.category);

    this.svg.selectAll('*').remove();

    // Create the x and y scales
    const x = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, this.viewBoxWidth - this.margin.left - this.margin.right]);
    const y = d3
      .scaleBand()
      .domain(groups)
      .range([0, this.viewBoxHeight - this.margin.top - this.margin.bottom])
      .padding(this.padding);

    const color = d3
      .scaleOrdinal<string>()
      .domain(subgroups)
      .range(['#6ee7b7', '#d6d3d1', '#fda4af']);

    // Show the stacked bar
    const stackedData = d3.stack().keys(subgroups)(data as any);
    this.svg
      .append('g')
      .selectAll('g')
      .data(stackedData)
      .join('g')
      .attr('fill', (d: { key: string }) => color(d.key) as string)
      .selectAll('rect')
      .data((d: any) => d)
      .join('rect')
      .attr('x', (d: d3.NumberValue[]) => x(d[0]))
      .attr('y', (d: { data: { category: string } }) => y(d.data.category)!)
      .attr('width', (d: d3.NumberValue[]) => x(d[1]) - x(d[0]))
      .attr('height', y.bandwidth());

    // Add values inside bars
    this.svg
      .append('g')
      .selectAll('g')
      .data(stackedData)
      .join('g')
      .attr('fill', (d: { key: string }) => color(d.key) as string)
      .selectAll('text')
      .data((d: any) => d)
      .join('text')
      .attr('x', (d: d3.NumberValue[]) => x(d[0]) + (x(d[1]) - x(d[0])) / 2)
      .attr(
        'y',
        (d: { data: { category: string } }) =>
          y(d.data.category)! + y.bandwidth() / 2,
      )
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')

      .attr('font-weight', '700')
      .text((d: number[]) => {
        const segmentWidth = x(d[1]) - x(d[0]);
        if (segmentWidth < 30) return '';

        let text = ((d[1] - d[0]) * 100).toFixed();
        return text + '%';
      });
  }
}
