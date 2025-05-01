import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
interface BracketNode {
  name?: string;
  diff?: number;
  children?: BracketNode[];
  id?: number;
}

@Component({
  selector: 'pdz-league-single-elim-bracket',
  template: `
    <div class="bracket-container p-4 bg-white rounded shadow">
      <h2 class="text-xl font-semibold text-center mb-4">
        {{ componentTitle }}
      </h2>
      <svg #bracketSvgContainer></svg>
    </div>
  `,
  styles: [
    `
      /* Component-specific styles (can be moved to a separate .css file) */
      /* Using :host ::ng-deep for potentially overriding D3 default styles if needed,
       or just define them globally if preferred. For simplicity here, we define them directly.
       If not using ::ng-deep, ensure these styles are in a global stylesheet or
       configure view encapsulation appropriately. */

      :host ::ng-deep .node text {
        font: 12px sans-serif;
        fill: #333;
      }

      /* Ensure the container allows scrolling if bracket is too wide */
      :host .bracket-container {
        width: 100%;
        overflow-x: auto;
        background-color: white; /* Ensure background for contrast */
      }

      /* Default SVG size - can be adjusted */
      :host ::ng-deep svg {
        width: 900px; /* Default width */
        height: 700px; /* Default height */
        display: block; /* Prevents extra space below SVG */
        margin: auto; /* Center if container is wider */
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueSingleElimBracketComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input() componentTitle: string = 'Tournament Bracket (Single Elimination)';
  @Input() bracketData: BracketNode = {
    children: [
      {
        children: [
          {
            children: [
              {
                children: [{ name: '02ThatOneGuy' }, { name: 'TheNPC420' }],
              },
              {
                children: [{ name: 'Lion' }, { name: 'Steven' }],
              },
            ],
          },
          {
            children: [
              {
                children: [{ name: 'Feather' }, { name: 'BR@D' }],
              },
              {
                children: [{ name: 'Dotexe' }, { name: 'Kat' }],
              },
            ],
          },
        ],
      },
      {
        children: [
          {
            children: [
              {
                children: [{ name: 'ChristianDeputy' }, { name: 'Lumaris' }],
              },
              {
                children: [{ name: 'Speedy' }, { name: 'SuperSpiderPig' }],
              },
            ],
          },
          {
            children: [
              {
                children: [
                  { name: 'Hsoj Super long team name' },
                  { name: 'Jimothy J' },
                ],
              },
              {
                name: 'Rai',
                children: [
                  { name: 'TheNotoriousABS', diff: -2 },
                  { name: 'Rai', diff: 2 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  @Input() width: number = 900;
  @Input() height: number = 700;
  imageSize = 16;
  @ViewChild('bracketSvgContainer') private bracketContainer!: ElementRef;

  constructor() {}

  winnerSize = 120;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.bracketData) {
      this.createBracket();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['bracketData'] || changes['width'] || changes['height']) &&
      !changes['bracketData']?.firstChange
    ) {
      if (this.bracketContainer?.nativeElement) {
        this.createBracket();
      }
    }
  }

  private createBracket(): void {
    if (!this.bracketData) {
      console.error('Bracket data is missing.');
      return;
    }

    const element = this.bracketContainer.nativeElement;

    d3.select(element).selectAll('*').remove();

    const svg = d3
      .select(element)
      .attr('width', this.width)
      .attr('height', this.height);
    const clipPathId = 'circle-mask';

    const defs = svg.append('defs');

    defs
      .append('clipPath')
      .attr('id', clipPathId)
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', this.imageSize / 2);

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = this.width - margin.left - margin.right;
    const innerHeight = this.height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const treeLayout = d3
      .tree<BracketNode>()
      .size([innerHeight, innerWidth - this.winnerSize]);
    const root = d3.hierarchy(this.bracketData);

    treeLayout(root);

    let count = 0;

    root.each((d) => {
      d.y = innerWidth - d.y! - this.winnerSize;
      d.data.id = ++count;
    });

    function niceLinkGenerator(d: d3.HierarchyLink<BracketNode>): string {
      const source = d.source as d3.HierarchyPointNode<BracketNode>;
      const target = d.target as d3.HierarchyPointNode<BracketNode>;
      const maxTurnSize = 20;
      const pivotX = (source.y - target.y) / 6;
      const inflectY = (source.x - target.x) / 2;
      const curve = Math.min(Math.abs(pivotX), Math.abs(inflectY), maxTurnSize);
      const sign = inflectY > 0 ? 1 : -1;
      return (
        `M${source.y},${source.x}` +
        `h${curve - pivotX}` +
        `q${-curve} 0${-curve} ${sign * -curve}` +
        `v${-(inflectY - sign * curve) * 2}` +
        `q0 ${sign * -curve} ${-curve} ${sign * -curve}` +
        `H${target.y}`
      );
    }

    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (d: d3.HierarchyLink<BracketNode>) =>
        d.target.data.diff && d.target.data.diff > 0
          ? 'lightgreen'
          : d.target.data.diff && d.target.data.diff < 0
            ? 'lightcoral'
            : '#ccc',
      )
      .attr('stroke-width', '2px')
      .attr('d', niceLinkGenerator);

    const node = g
      .selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr(
        'class',
        (d: d3.HierarchyNode<BracketNode>) =>
          `node ${d.children ? 'node--internal' : 'node--leaf'}`,
      )
      .attr(
        'transform',
        (d: d3.HierarchyNode<BracketNode>) => `translate(${d.y},${d.x})`,
      );

    node
      .append('rect')
      .attr('fill', '#fff')
      .attr('stroke', (d: d3.HierarchyNode<BracketNode>) =>
        d.data.diff && d.data.diff > 0
          ? 'lightgreen'
          : d.data.diff && d.data.diff < 0
            ? 'lightcoral'
            : 'steelblue',
      )
      .attr('stroke-width', '2px')
      .attr(
        'width',
        (d: d3.HierarchyNode<BracketNode>) =>
          `${d.parent?.y ? ((d.parent.y - d.y!) * 2) / 3 : this.winnerSize}`,
      )
      .attr('height', '20px')
      .attr('rx', '5')
      .attr('transform', `translate(0,-10)`);

    node
      .append('foreignObject')
      .attr(
        'width',
        (d: d3.HierarchyNode<BracketNode>) =>
          `${d.parent?.y ? ((d.parent.y - d.y!) * 2) / 3 : this.winnerSize}`,
      )
      .attr('y', '-10px')
      .attr('height', '20px')
      .append('xhtml:div')
      .style('color', 'black')
      .style('padding', '0 .125rem')
      .style('height', '100%')
      .style('box-sizing', 'border-box')
      .style('white-space', 'nowrap')
      .style('overflow', 'hidden')
      .style('font-size', '.8em')
      .style('text-overflow', 'ellipsis')
      .html((d: d3.HierarchyNode<BracketNode>) => d.data.name ?? ``);

    // node
    //   .append('text')
    //   .attr('dy', '0.31em')
    //   .attr('x', 2)
    //   .attr('text-anchor', 'start')
    //   .text((d: d3.HierarchyNode<BracketNode>) => d.data.name ?? ``)
    //   .clone(true)
    //   .lower()
    //   .attr('stroke-linejoin', 'round')
    //   .attr('stroke-width', 3)
    //   .attr('stroke', 'white');

    node
      .filter((d: d3.HierarchyNode<BracketNode>) => !!d.children)
      .append('text')
      .attr('dy', '0.31em')
      .attr(
        'x',
        (d: d3.HierarchyNode<BracketNode>) =>
          -(d.y! - d.children![0].y!) / 6 - 4,
      )
      .attr('text-anchor', 'end')
      .text((d: d3.HierarchyNode<BracketNode>) => d.data.id!)
      .clone(true)
      .lower()
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .attr('stroke', 'white');
  }
}
