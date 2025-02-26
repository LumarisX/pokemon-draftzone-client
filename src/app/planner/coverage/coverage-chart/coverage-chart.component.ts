//@ts-nocheck
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { CoveragePokemon } from '../../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { typeColor } from '../../../util/styling';
import { HierarchyNode } from 'd3';

interface ExtendedHierarchyNode
  extends d3.HierarchyNode<{
    name: string;
    children?: { name: string; value?: number }[];
    value?: number;
    fill?: string;
  }> {
  current: { x0: number; x1: number; y0: number; y1: number };
  target?: { x0: number; x1: number; y0: number; y1: number };
}

@Component({
  selector: 'coverage-chart',
  standalone: true,
  templateUrl: './coverage-chart.component.html',
  styleUrl: './coverage-chart.component.scss',
  imports: [SpriteComponent],
})
export class CoverageChartComponent implements OnInit {
  @Input() data!: CoveragePokemon;
  @Input() monCount!: number;

  private width = 250;
  private height = 250;
  private radius = Math.min(this.width, this.height) / 2;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.createSunburst();
  }

  private createSunburst(): void {
    const hierarchyData = {
      name: 'root',
      children: [
        {
          name: 'Physical',
          children: Object.entries(this.data.fullcoverage.physical).map(
            ([type, moves]) => ({
              name: type,
              fill: typeColor(type),
              children: moves.map((move) => ({
                name: move.name,
                value: move.ePower,
                fill: typeColor(type),
                icon: `../../../../assets/icons/types/gen9icon/${type}.png`,
              })),
            }),
          ),
          icon: '../../../../assets/icons/moves/move-physical.png',
          fill: '#EF6845',
        },
        {
          name: 'Special',
          children: Object.entries(this.data.fullcoverage.special).map(
            ([type, moves]) => ({
              name: type,
              fill: typeColor(type),
              children: moves.map((move) => ({
                name: move.name,
                value: move.ePower,
                fill: typeColor(type),
                icon: `../../../../assets/icons/types/gen9icon/${type}.png`,
              })),
            }),
          ),
          icon: '../../../../assets/icons/moves/move-physical.png',
          fill: '#61ADF3',
        },
      ],
    };

    const width = 928;
    const height = width;
    const radius = width / 6;

    // Compute the layout.
    const hierarchy = d3
      .hierarchy(hierarchyData)
      .sum((d: any) => d.value)
      .sort((a: any, b: any) => b.value - a.value);
    const root = d3
      .partition<typeof hierarchyData>()
      .size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
    root.each((d: any) => (d.current = d));
    // Create the arc generator.
    const arc = d3
      .arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d: any) => d.y0 * radius)
      .outerRadius((d: any) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    // Create the SVG container.

    const svg = d3
      .select(this.el.nativeElement)
      .select('svg')
      .attr('viewBox', [-width / 2, -height / 2, width, width]);

    // Append the arcs.
    const path = svg
      .append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
      .attr('fill', (d: any) => {
        return d.data.fill;
      })
      .attr('fill-opacity', (d: any) => (arcVisible(d.current) ? 1 : 0))
      .attr('pointer-events', (d: any) =>
        arcVisible(d.current) ? 'auto' : 'none',
      )

      .attr('d', (d: any) => arc(d.current));

    // Make them clickable if they have children.
    path
      .filter((d: any) => d.children)
      .style('cursor', 'pointer')
      .on('click', clicked);

    const format = d3.format(',d');
    path.append('title').text(
      (d) =>
        `${d
          .ancestors()
          .map((d) => d.data.name)
          .reverse()
          .join('/')}\n${format(d.value!)}`,
    );

    const label = svg
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
      .attr('dy', '0.35em')
      .attr('fill-opacity', (d: any) => +labelVisible(d.current))
      .attr('transform', (d: any) => labelTransform(d.current))
      .text((d) => d.data.name);

    const parent = svg
      .append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('click', clicked);

    // Handle zoom on click.
    function clicked(event: any, p: any) {
      parent.datum(p.parent || root);

      root.each(
        (d: any) =>
          (d.target = {
            x0:
              Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
              2 *
              Math.PI,
            x1:
              Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
              2 *
              Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth),
          }),
      );

      const t = svg.transition().duration(event.altKey ? 7500 : 750);

      // Transition the data on all arcs, even the ones that aren’t visible,
      // so that if this transition is interrupted, entering arcs will start
      // the next transition from the desired position.
      path
        .transition(t)
        .tween('data', (d: any) => {
          const i = d3.interpolate(d.current, d.target);
          return (t) => (d.current = i(t));
        })
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || arcVisible(d.target);
        })
        .attr('fill-opacity', (d: any) => (arcVisible(d.target) ? 1 : 0))
        .attr('pointer-events', (d: any) =>
          arcVisible(d.target) ? 'auto' : 'none',
        )

        .attrTween('d', (d: any) => () => arc(d.current));

      label
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || labelVisible(d.target);
        })
        .transition(t)
        .attr('fill-opacity', (d: any) => +labelVisible(d.target))
        .attrTween('transform', (d: any) => () => labelTransform(d.current));
    }

    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    return svg.node();
  }
}
