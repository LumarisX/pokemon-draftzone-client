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
import { attackData, defenseData } from '../../league-ghost';

type BracketTeamData = {
  teamName: string;
  coachName: string;
  seed: number;
};

type BracketNode = {
  diff?: number;
  children?: BracketNode[];
  id?: number;
  team?: BracketTeamData;
};

type HierarchyPointNodeWithData = d3.HierarchyNode<BracketNode>;

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
  styleUrl: './league-bracket-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueBracketGraphComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input() componentTitle: string = 'Tournament Bracket (Single Elimination)';
  teams: BracketTeamData[] = [
    ...defenseData
      .map((team) => ({
        teamName: team.teamName,
        coachName: team.coaches[0],
        seed: team.seed,
      }))
      .filter((team) => team.seed <= 8)
      .sort((x, y) => x.seed - y.seed),
    ...attackData
      .map((team) => ({
        teamName: team.teamName,
        coachName: team.coaches[0],
        seed: team.seed,
      }))
      .filter((team) => team.seed <= 8)
      .sort((x, y) => x.seed - y.seed),
  ];

  @Input() bracketData: BracketNode = {
    children: [
      {
        children: [
          {
            children: [
              {
                children: [{ team: this.teams[0] }, { team: this.teams[15] }],
              },
              {
                children: [{ team: this.teams[3] }, { team: this.teams[12] }],
              },
            ],
          },
          {
            children: [
              {
                children: [{ team: this.teams[1] }, { team: this.teams[14] }],
              },
              {
                children: [{ team: this.teams[5] }, { team: this.teams[10] }],
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
                children: [{ team: this.teams[2] }, { team: this.teams[13] }],
              },
              {
                children: [{ team: this.teams[6] }, { team: this.teams[9] }],
              },
            ],
          },
          {
            children: [
              {
                children: [{ team: this.teams[4] }, { team: this.teams[11] }],
              },
              {
                team: this.teams[8],
                children: [
                  { team: this.teams[7], diff: -2 },
                  { team: this.teams[8], diff: 2 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  @Input() width: number = 1200;
  @Input() height: number = 900;
  imageSize = 16;
  @ViewChild('bracketSvgContainer') private bracketContainer!: ElementRef;

  constructor() {
    console.log(this.teams);
  }

  winnerSize = 120;
  matchupVerticalSeparation = 42; // *** NEW: Control vertical space between teams in a single matchup ***
  nodeBoxHeight = 40; // *** NEW: Consistent height for node boxes ***

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

    const margin = { top: 30, right: 50, bottom: 30, left: 50 }; // Adjusted margins
    const innerWidth = this.width - margin.left - margin.right;
    const innerHeight = this.height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const treeLayout = d3
      .tree<BracketNode>()
      .size([innerHeight, innerWidth - this.winnerSize]); // Original
    //   .size([innerHeight, innerWidth]);
    const root = d3.hierarchy(this.bracketData);

    treeLayout(root);

    let count = 0;

    root.each((d) => {
      d.y = innerWidth - d.y! - this.winnerSize;
      d.data.id = ++count;
    });

    root.eachAfter((node: HierarchyPointNodeWithData) => {
      if (node.children && node.children.length > 0) {
        if (node.children.length === 2) {
          const parentX = node.x!;
          const firstChild = node.children[0];
          const secondChild = node.children[1];

          firstChild.x = parentX - this.matchupVerticalSeparation / 2;
          secondChild.x = parentX + this.matchupVerticalSeparation / 2;

          const meanX = d3.mean(node.children, (d) => d.x);
          if (meanX !== undefined) {
            node.x = meanX;
          }
        } else if (node.children.length === 1) {
        } else if (node.children.length > 2) {
        }
      }
    });

    function niceLinkGenerator(d: d3.HierarchyLink<BracketNode>): string {
      const source = d.source as d3.HierarchyPointNode<BracketNode>;
      const target = d.target as d3.HierarchyPointNode<BracketNode>;
      const maxTurnSize = 2;
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
      .filter((d) => !d.target.data.diff || d.target.data.diff < 0)
      .attr('fill', 'none')
      .attr('stroke', (d: d3.HierarchyLink<BracketNode>) =>
        d.target.data.diff && d.target.data.diff < 0 ? 'lightcoral' : '#ccc',
      )
      .attr('stroke-width', (d: d3.HierarchyLink<BracketNode>) =>
        d.target.data.diff && d.target.data.diff < 0 ? '1.95px' : '2px',
      )
      .attr('d', niceLinkGenerator);

    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .filter((d) => !!d.target.data.diff && d.target.data.diff > 0)
      .attr('fill', 'none')
      .attr('stroke', 'lightgreen')
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

    const boxDims = {
      height: 36,
      radius: 8,
    };

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
      .attr('height', `${boxDims.height}px`)
      .attr('rx', boxDims.radius)
      .attr('transform', `translate(0,${-boxDims.height / 2})`);

    node
      .filter((d: d3.HierarchyNode<BracketNode>) => !!d.data.team)
      .append('foreignObject')
      .attr(
        'width',
        (d: d3.HierarchyNode<BracketNode>) =>
          `${d.parent?.y ? ((d.parent.y - d.y!) * 2) / 3 : this.winnerSize}`,
      )
      .attr('y', `${-boxDims.height / 2}px`)
      .attr('height', `${boxDims.height}px`)
      .append('xhtml:div')
      .attr('class', 'node-team')
      .html(
        (d: d3.HierarchyNode<BracketNode>) => `
        <div class="team-logo"><img [src]="match.team2.logo" /></div>
        <div class="team-info">
            <div class="team-name">${d.data.team!.teamName}</div>
            <div class="coach-info">
                <span class="coach-name">${d.data.team!.coachName}</span>
            </div>
        </div>
        <div class="team-score">0</div>
      `,
      );

    node
      .filter((d: d3.HierarchyNode<BracketNode>) => !d.data.team)
      .append('text')
      .attr('dy', `.31em`)
      .attr('dx', '4px')
      .attr('text-anchor', 'start')
      .attr('class', 'node-placeholder')
      .text((d: d3.HierarchyNode<BracketNode>) => `Winner of ${d.data.id}`)
      .clone(true)
      .lower()
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .attr('stroke', 'white');

    node
      .filter(
        (d: d3.HierarchyNode<BracketNode>) =>
          !!d.parent && d.parent.children?.indexOf(d) == 0,
      )
      .append('foreignObject')
      .attr(
        'x',
        (d: d3.HierarchyNode<BracketNode>) =>
          ((d.parent!.y! - d.y!) * 5) / 6 - 12,
      )
      .attr('y', (d) => d.y!)
      .attr('width', '24px')
      .attr('height', `${boxDims.height}px`)
      .append('xhtml:div')
      .html(
        (d: d3.HierarchyNode<BracketNode>) => `
       ${d.data.id}
      `,
      );

    node
      .filter((d: d3.HierarchyNode<BracketNode>) => !d.children)
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', -6)
      .attr('class', 'seed')
      .text((d: d3.HierarchyNode<BracketNode>) => d.data.team!.seed)
      .clone(true)
      .lower()
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .attr('stroke', 'white');
  }
}
