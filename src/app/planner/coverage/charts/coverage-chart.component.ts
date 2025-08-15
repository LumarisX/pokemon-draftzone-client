//@ts-nocheck
import { Component, ElementRef, Input, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import { getSpriteProperties } from '../../../data/namedex';
import {
  CoveragePokemon,
  FullCoverageMove,
} from '../../../drafts/matchup-overview/matchup-interface';
import { typeColor } from '../../../util/styling';
import { SpriteService } from '../../../services/sprite.service';

type DataPoint = {
  name: string;
  fill?: string | null;
  icon?: string;
  iconSize?: number;
  children?: DataPoint[];
  moveData?: FullCoverageMove;
  value?: number;
};

interface PositionData {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface ExtendedNode<T> extends d3.HierarchyRectangularNode<T> {
  current: ExtendedNode<T>;
  target: PositionData;
}

@Component({
  selector: 'coverage-chart',
  standalone: true,
  template: '<svg></svg>',
  imports: [],
})
export class CoverageChartComponent implements OnDestroy {
  @Input()
  set data(value: CoveragePokemon) {
    this.updateChart(value);
  }

  constructor(
    private el: ElementRef,
    private spriteService: SpriteService,
  ) {}

  chartData!: CoveragePokemon;
  svg;

  ngOnDestroy(): void {
    this.destroyChart();
  }

  updateChart(data: CoveragePokemon): void {
    this.destroyChart();
    this.chartData = data;
    this.createSunburst();
  }

  destroyChart(): void {
    if (this.svg) {
      this.svg.selectAll('*').remove();
    }
    d3.select(this.el.nativeElement).select('.chart-tooltip').remove();
    d3.select(this.el.nativeElement).select('svg').on('.zoom', null);
  }

  private createSunburst(): void {
    const hierarchyData: DataPoint = {
      name: this.chartData.id,
      children: [
        {
          name: 'Physical',
          children: Object.entries(this.chartData.fullcoverage.physical)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([type, moves]) => ({
              name: type,
              fill: typeColor(type),
              icon: `../../../../assets/icons/types/gen9icon/${type}.png`,
              iconSize: 80,
              children: moves.map((move) => ({
                name: move.name,
                value: move.value,
                moveData: move,
              })),
            })),
          icon: '../../../../assets/icons/moves/sv/physical.png',
          iconSize: 150,
          fill: '#EF6845',
        },
        {
          name: 'Special',
          children: Object.entries(this.chartData.fullcoverage.special)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([type, moves]) => ({
              name: type,
              fill: typeColor(type),
              icon: `../../../../assets/icons/types/gen9icon/${type}.png`,
              iconSize: 80,
              children: moves.map((move) => ({
                name: move.name,
                value: move.value,
                moveData: move,
              })),
            })),
          icon: '../../../../assets/icons/moves/sv/special.png',
          iconSize: 150,
          fill: '#61ADF3',
        },
      ],
    };

    const margin = { top: 50, bottom: 50, left: 50, right: 50 };
    const width = 800;
    const height = width;
    const radius = width / 6;

    // Compute the layout.
    const hierarchy = d3.hierarchy(hierarchyData).sum((d) => d.value ?? 0);

    const root: ExtendedNode<DataPoint> = d3
      .partition<DataPoint>()
      .size([2 * Math.PI, hierarchy.height + 1])(
      hierarchy,
    ) as ExtendedNode<DataPoint>;
    root.each((d) => {
      d.current = d;
      d.target = d;
    });
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
      .attr('viewBox', [
        -width / 2 - margin.left,
        -height / 2 - margin.top,
        width + margin.right + margin.left,
        height + margin.top + margin.bottom,
      ]);

    this.svg = svg;

    const borderWidth = 0;

    const background = svg
      .append('circle')
      .datum(root)
      .attr('r', (width + borderWidth) / 2)
      .attr('fill', 'var(--mat-sys-surface)')
      .attr('stroke', 'var(--mat-sys-outline)')
      .attr('stroke-width', borderWidth)
      .attr('filter', 'url(#background-shadow)')
      .attr('pointer-events', 'all');

    // Append the arcs.
    const path: d3.Selection<
      SVGPathElement,
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
      .attr('d', (d: ExtendedNode<DataPoint>) =>
        arc(d.current),
      ) as d3.Selection<
      SVGPathElement,
      ExtendedNode<DataPoint>,
      SVGGElement,
      unknown
    >;

    // Make them clickable if they have children.
    path
      .filter((d) => !!d.children)
      .style('cursor', 'pointer')
      .on('click', clicked);

    path
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill-opacity', 0.7);
        if (d.data.moveData) {
          d3.select('.chart-tooltip')
            .style('opacity', 1)
            .html(
              `
                <div class="title-container">
                  <div class="title-wrapper">
                    <strong>${d.data.moveData.name}</strong>
                  </div>
                  <div class="icon-container">
                    <div class="category-wrapper"><img src=../../../../assets/icons/moves/move-${d.data.moveData.category.toLowerCase()}.png /></div>
                    <div class="type-wrapper"><img src=../../../../assets/icons/types/gen9words/${d.data.moveData.type}.png /></div>
                  </div>
                </div>
                <div class="details-container">
                  <div class="power-text"> 
                    <strong>Power:</strong>
                    <span>${d.data.moveData.basePower}</span>
                  </div>
                  <div class="acc-text">
                    <strong>Accuracy:</strong>
                    <span>${d.data.moveData.accuracy}</span>
                  </div>
                  <div class="pp-text"> 
                    <strong>PP:</strong>
                    <span>${d.data.moveData.pp}</span>
                  </div>
                </div>
                <div class="desc-container">
                  <strong>${d.data.moveData.desc}</strong>
                </div>
`,
            )
            .style('left', `${event.pageX}px`)
            .style('top', `${event.pageY}px`);
        }
      })
      .on('mousemove', function (event) {
        d3.select('.chart-tooltip')
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY}px`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill-opacity', 1);
        d3.select('.chart-tooltip').style('opacity', 0);
      });

    const labels: d3.Selection<
      SVGGElement,
      ExtendedNode<DataPoint>,
      SVGGElement,
      unknown
    > = svg
      .append('g')
      .attr('pointer-events', 'none')
      .style('user-select', 'none')
      .selectAll('g')
      .data(root.descendants())
      .join('g') as d3.Selection<
      SVGGElement,
      ExtendedNode<DataPoint>,
      SVGGElement,
      unknown
    >;

    labels.each(function (d) {
      const group: d3.Selection<
        SVGGElement,
        ExtendedNode<DataPoint>,
        null,
        undefined
      > = d3.select(this);
      if (d.data.icon && d.data.iconSize) {
        group
          .append('image')
          .attr('xlink:href', d.data.icon)
          .attr('width', d.data.iconSize * getIconScale(d.current))
          .attr('height', d.data.iconSize * getIconScale(d.current))
          .attr('opacity', +iconVisible(d.current))
          .attr('transform', (d) => iconTransform(d.data.iconSize!, d.current));
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
      .append('image')
      .datum(root)
      .attr('xlink:href', this.spriteService.getSpriteData(this.chartData).path)
      .attr('width', radius * 2)
      .attr('height', radius * 2)
      .attr('x', -radius)
      .attr('y', -radius)
      .attr('clip-path', `circle(${radius}px at center)`)
      .style('cursor', 'pointer')
      .on('click', clicked)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.7);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
      });

    // Handle zoom on click.
    function clicked(event: any, p: ExtendedNode<DataPoint>) {
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
        .tween('data', (d: ExtendedNode<DataPoint>) => {
          const i = d3.interpolate(d.current, d.target!);
          return (t) => (d.current = i(t));
        })
        .filter(function (d: any) {
          return !!this.getAttribute('fill-opacity') || arcVisible(d.target);
        })
        .attr('fill-opacity', (d) => (arcVisible(d.target) ? 1 : 0))
        .attr('pointer-events', (d) => (arcVisible(d.target) ? 'auto' : 'none'))
        .attrTween('d', (d) => () => arc(d.current!) ?? '');

      labels
        .selectAll('image')
        .filter(function (this: d3.BaseType, d: ExtendedNode<DataPoint>) {
          return !!this.getAttribute('opacity') || iconVisible(d.target);
        })
        .transition(t)
        .attr('width', (d: any) => d.data.iconSize * getIconScale(d.target))
        .attr('height', (d: any) => d.data.iconSize * getIconScale(d.target))
        .attr('opacity', (d: any) => +iconVisible(d.target))
        .attrTween(
          'transform',
          (d: any) => () => iconTransform(d.data.iconSize, d.current),
        );

      labels
        .selectAll('text')
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || labelVisible(d.target);
        })
        .transition(t)
        .attr('fill-opacity', (d: any) => +labelVisible(d.target))
        .attrTween('transform', (d: any) => () => labelTransform(d.current));
    }

    function arcVisible(d: PositionData) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d: PositionData) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.05;
    }

    function labelTransform(d: PositionData) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    function iconVisible(d: PositionData) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0;
    }

    function iconTransform(iconSize: number, d: PositionData) {
      if (d.y0 < 1)
        return `translate(-${(iconSize * getIconScale(d)) / 2},-${(iconSize * getIconScale(d)) / 2})`;
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${90 - x}) translate(-${(iconSize * getIconScale(d)) / 2},-${(iconSize * getIconScale(d)) / 2})`;
    }

    function getIconScale(d: PositionData): number {
      if (d.y0 >= 0 && d.y0 < 1) return 1;
      if (d.y0 >= 1 && d.y0 < 2) return 0.6;
      if (d.y0 >= 2 && d.y0 < 3) return 0.4;
      return 0;
    }

    // return svg.node();
  }
}
