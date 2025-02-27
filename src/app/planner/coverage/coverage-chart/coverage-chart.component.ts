//@ts-nocheck
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { CoveragePokemon } from '../../../drafts/matchup-overview/matchup-interface';
import { typeColor } from '../../../util/styling';

type DataPoint = {
  name: string;
  fill?: string | null;
  icon?: string;
  children?: DataPoint[];
};

interface ExtendedNode<T> extends d3.HierarchyRectangularNode<T> {
  current: ExtendedNode<T>;
  target: ExtendedNode<T>;
}

@Component({
  selector: 'coverage-chart',
  standalone: true,
  templateUrl: './coverage-chart.component.html',
  styleUrl: './coverage-chart.component.scss',
  imports: [],
})
export class CoverageChartComponent implements OnInit {
  @Input() data!: CoveragePokemon;
  @Input() monCount!: number;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.createSunburst();
  }

  private createSunburst(): void {
    const hierarchyData: DataPoint = {
      name: this.data.id,
      fill: 'var(--mat-sys-surface)',
      icon: `https://img.pokemondb.net/sprites/home/normal/pelipper.png`,
      children: [
        {
          name: 'Physical',
          children: Object.entries(this.data.fullcoverage.physical).map(
            ([type, moves]) => ({
              name: type,
              fill: typeColor(type),
              icon: `../../../../assets/icons/types/gen9icon/${type}.png`,
              children: moves.map((move) => ({
                name: move.name,
                value: move.value,
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
              icon: `../../../../assets/icons/types/gen9icon/${type}.png`,
              children: moves.map((move) => ({
                name: move.name,
                value: move.value,
              })),
            }),
          ),
          icon: '../../../../assets/icons/moves/move-special.png',
          fill: '#61ADF3',
        },
      ],
    };

    const width = 750;
    const height = width;
    const radius = width / 6;
    const iconSize = width / 10;

    // Compute the layout.
    const hierarchy = d3
      .hierarchy(hierarchyData)
      .sum((d: any) => d.value)
      .sort((a: any, b: any) => b.value - a.value);
    const root: ExtendedNode<DataPoint> = d3
      .partition<DataPoint>()
      .size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
    root.each((d) => (d.current = d));

    // Create the arc generator.
    const arc = d3
      .arc<ExtendedNode<DataPoint>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    // Create the SVG container.

    const svg = d3
      .select(this.el.nativeElement)
      .select('svg')
      .attr('viewBox', [-width / 2, -height / 2, width, width]);

    // Append the arcs.
    const path: d3.Selection<
      d3.BaseType | SVGPathElement,
      ExtendedNode<DataPoint>,
      SVGGElement,
      unknown
    > = svg
      .append('g')
      .selectAll('path')
      .data(root.descendants())
      .join('path')
      .attr('fill', (d) => {
        while (d.depth > 2) if (d.parent) d = d.parent;
        return d.data.fill ?? '';
      })
      .attr('fill-opacity', (d: ExtendedNode<DataPoint>) =>
        arcVisible(d.current) ? 1 : 0,
      )
      .attr('pointer-events', (d: ExtendedNode<DataPoint>) =>
        arcVisible(d.current) ? 'auto' : 'none',
      )
      .attr('d', (d: ExtendedNode<DataPoint>) => arc(d.current));

    // Make them clickable if they have children.
    path
      .filter((d) => !!d.children)
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

    const labels = svg
      .append('g')
      .attr('pointer-events', 'none')
      .style('user-select', 'none')
      .selectAll('g')
      .data(root.descendants())
      .join('g');

    labels.each(function (d) {
      const group: d3.Selection<
        d3.BaseType | SVGGElement,
        ExtendedNode<DataPoint>,
        null,
        undefined
      > = d3.select(this);
      if (d.data.icon) {
        group
          .append('image')
          .attr('xlink:href', d.data.icon)
          .attr('width', iconSize)
          .attr('height', iconSize)
          .attr('opacity', +iconVisible(d.current))
          .attr('transform', (d) => iconTransform(d.current));
      } else {
        group
          .append('text')
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill-opacity', +labelVisible(d.current))
          .attr('transform', (d: any) => labelTransform(d.current))
          .attr('fill', '#fff')
          .attr('font-weight', '700')
          .text(d.data.name);
      }
    });

    const parent = svg
      .append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('click', clicked);

    // Handle zoom on click.
    function clicked(event: any, p: ExtendedNode<DataPoint>) {
      parent.datum(p.parent || root);

      root.each(
        (d) =>
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
        .tween('data', (d) => {
          const i = d3.interpolate(d.current, d.target!);
          return (t) => (d.current = i(t));
        })
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || arcVisible(d.target);
        })
        .attr('fill-opacity', (d) => (arcVisible(d.target) ? 1 : 0))
        .attr('pointer-events', (d) => (arcVisible(d.target) ? 'auto' : 'none'))
        .attrTween('d', (d) => () => arc(d.current!) ?? '');

      labels
        .selectAll('image')
        .filter(function (d: any) {
          return +this.getAttribute('opacity') || iconVisible(d.target);
        })
        .transition(t)
        .attr('opacity', (d: any) => +iconVisible(d.target))
        .attrTween('transform', (d: any) => () => iconTransform(d.current));

      labels
        .selectAll('text')
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || labelVisible(d.target);
        })
        .transition(t)
        .attr('fill-opacity', (d: any) => +labelVisible(d.target))
        .attrTween('transform', (d: any) => () => labelTransform(d.current));
    }

    function arcVisible(d: ExtendedNode<DataPoint>) {
      return d.y1 <= 3 && d.y0 >= 0 && d.x1 > d.x0;
    }

    function labelVisible(d: ExtendedNode<DataPoint>) {
      return d.y1 <= 3 && d.y0 >= 0 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.05;
    }

    function labelTransform(d: ExtendedNode<DataPoint>) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    function iconVisible(d: ExtendedNode<DataPoint>) {
      return d.y1 <= 3 && d.y0 >= 0 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0;
    }

    function iconTransform(d: ExtendedNode<DataPoint>) {
      if (d.y0 < 1) return `translate(-${iconSize / 2},-${iconSize / 2})`;
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${90 - x}) translate(-${iconSize / 2},-${iconSize / 2})`;
    }

    // return svg.node();
  }
}
