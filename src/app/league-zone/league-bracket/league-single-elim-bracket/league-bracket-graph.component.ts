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
import { RouterModule } from '@angular/router';

type BracketTeamData = {
  teamName: string;
  coachName: string;
  seed: number;
  logo?: string;
};

type MatchDetails = {
  winner: number;
  replay?: string;
};

type TeamNode = {
  type: 'team';
  team: BracketTeamData;
  score?: number;
};

type MatchNode = {
  type: 'match';
  score?: number;
  id?: number;
  matchDetails?: MatchDetails;
  children: BracketNode[];
};

export type BracketNode = TeamNode | MatchNode;

type HierarchyPointNodeWithData = d3.HierarchyNode<BracketNode>;

@Component({
  imports: [RouterModule],
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
        logo: team.logo,
      }))
      .filter((team) => team.seed <= 8)
      .sort((x, y) => x.seed - y.seed),
    ...attackData
      .map((team) => ({
        teamName: team.teamName,
        coachName: team.coaches[0],
        seed: team.seed,
        logo: team.logo,
      }))
      .filter((team) => team.seed <= 8)
      .sort((x, y) => x.seed - y.seed),
  ];

  altTeams: BracketTeamData[] = [...defenseData, ...attackData]

    .sort((x, y) => x.seed - y.seed)
    .map((team, index) => ({
      teamName: team.teamName,
      coachName: team.coaches[0],
      seed: index,
      logo: team.logo,
    }))
    .filter((team) => team.seed <= 32);

  @Input() bracketData: BracketNode = {
    type: 'match',
    children: [
      {
        type: 'match',
        children: [
          {
            type: 'match',
            children: [
              {
                matchDetails: {
                  winner: 0,
                },
                type: 'match',
                children: [
                  { type: 'team', team: this.teams[0], score: 5 },
                  { type: 'team', team: this.teams[15] },
                ],
              },
              {
                matchDetails: {
                  winner: 0,
                },
                type: 'match',
                children: [
                  { type: 'team', team: this.teams[3], score: 2 },
                  { type: 'team', team: this.teams[12] },
                ],
              },
            ],
          },
          {
            matchDetails: {
              winner: 1,
            },
            type: 'match',
            children: [
              {
                type: 'match',
                matchDetails: {
                  winner: 0,
                },
                children: [
                  { type: 'team', team: this.teams[1], score: 4 },
                  { type: 'team', team: this.teams[14] },
                ],
              },
              {
                matchDetails: {
                  winner: 0,
                },
                score: 4,

                type: 'match',
                children: [
                  { type: 'team', team: this.teams[5], score: 3 },
                  { type: 'team', team: this.teams[10] },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'match',
        children: [
          {
            type: 'match',

            children: [
              {
                type: 'match',
                matchDetails: {
                  winner: 1,
                },
                children: [
                  { type: 'team', team: this.teams[2] },
                  { type: 'team', team: this.teams[13], score: 2 },
                ],
              },
              {
                type: 'match',
                matchDetails: {
                  winner: 1,
                },
                children: [
                  { type: 'team', team: this.teams[6] },
                  { type: 'team', team: this.teams[9], score: 4 },
                ],
              },
            ],
          },
          {
            type: 'match',

            children: [
              {
                type: 'match',
                matchDetails: {
                  winner: 0,
                },
                children: [
                  { type: 'team', team: this.teams[4], score: 5 },
                  { type: 'team', team: this.teams[11] },
                ],
              },
              {
                type: 'match',
                matchDetails: {
                  winner: 1,
                },
                children: [
                  { type: 'team', team: this.teams[7] },
                  { type: 'team', team: this.teams[8], score: 2 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  @Input() maxWidth: number = 1200;
  @Input() maxHeight: number = 1600;
  @Input() margin = { top: 50, right: 10, bottom: 10, left: 30 };
  imageSize = 16;
  @ViewChild('bracketSvgContainer') private bracketContainer!: ElementRef;

  constructor() {
    // this.teams = this.altTeams;
    // this.bracketData = this.generateBracket(this.teams);
  }

  generateBracket(teams: BracketTeamData[]): BracketNode {
    if (teams.length > 2) {
      const sides: [BracketTeamData[], BracketTeamData[]] = [[], []];
      teams.forEach((team, index) => {
        sides[index % 2 === Math.floor(index / 2) % 2 ? 0 : 1].push(team);
      });
      return {
        type: 'match',
        children: [
          this.generateBracket(sides[0]),
          this.generateBracket(sides[1]),
        ],
      };
    }
    if (teams.length === 2) {
      return {
        type: 'match',
        children: [
          { type: 'team', team: teams[0] },
          { type: 'team', team: teams[1] },
        ],
      };
    } else {
      return { type: 'team', team: teams[0] };
    }
  }

  matchupVerticalSeparation = 6;
  stageHorizontalSeparation = 64;
  nodeBox = { height: 40, width: 160, radius: 4 };
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

    const verticalNodeCenterSeparation =
      this.nodeBox.height + this.matchupVerticalSeparation;
    const horizontalNodeCenterSeparation =
      this.nodeBox.width + this.stageHorizontalSeparation;

    const treeLayout = d3
      .tree<BracketNode>()
      .nodeSize([verticalNodeCenterSeparation, horizontalNodeCenterSeparation])
      .separation((a, b) => (a.parent == b.parent ? 1 : 1.25));

    const root = d3.hierarchy(this.bracketData);
    treeLayout(root);

    let count = 0;
    const yFlip = true;
    if (yFlip) {
      const maxOriginalY = d3.max(root.descendants(), (d) => d.y!) || 0;
      root.each((d: HierarchyPointNodeWithData) => {
        d.y = maxOriginalY - d.y!;
        if (d.data.type === 'match' && d.data.id === undefined) {
          d.data.id = ++count;
        }
      });
    } else {
      root.each((d: HierarchyPointNodeWithData) => {
        if (d.data.type === 'match' && d.data.id === undefined) {
          d.data.id = ++count;
        }
      });
    }
    const stageYCoords = new Map<number, number>();

    root.eachAfter((node: HierarchyPointNodeWithData) => {
      if (node.children && node.children.length > 0) {
        if (node.children.length === 2) {
          const parentX = node.x!;
          const firstChild = node.children[0];
          const secondChild = node.children[1];

          firstChild.x =
            parentX -
            (this.nodeBox.height + this.matchupVerticalSeparation) / 2;
          secondChild.x =
            parentX +
            (this.nodeBox.height + this.matchupVerticalSeparation) / 2;

          const meanX = d3.mean(node.children, (d) => d.x);
          if (meanX !== undefined) {
            node.x = meanX;
          }
        } else if (node.children.length === 1) {
        } else if (node.children.length > 2) {
        }
      }

      if (!stageYCoords.has(node.depth)) {
        stageYCoords.set(
          node.depth,
          node.parent
            ? (node.parent.y! + node.y! - this.stageHorizontalSeparation) / 2
            : node.y! + this.nodeBox.width / 2,
        );
      }
    });

    let finalMinX = Infinity,
      finalMaxX = -Infinity,
      finalMinY = Infinity,
      finalMaxY = -Infinity;

    root.each((d: HierarchyPointNodeWithData) => {
      let currentPaddedNodeWidth: number;
      if (!d.parent) {
        currentPaddedNodeWidth = this.nodeBox.width;
      } else {
        currentPaddedNodeWidth =
          Math.abs(d.parent.y! - d.y!) - this.stageHorizontalSeparation;
      }
      currentPaddedNodeWidth = Math.max(0, currentPaddedNodeWidth);

      const nodeLeft = d.y!;
      const nodeRight = d.y! + this.nodeBox.width;
      const nodeTop = d.x! - this.nodeBox.height / 2;
      const nodeBottom = d.x! + this.nodeBox.height / 2;

      if (nodeLeft < finalMinY) finalMinY = nodeLeft;
      if (nodeRight > finalMaxY) finalMaxY = nodeRight;
      if (nodeTop < finalMinX) finalMinX = nodeTop;
      if (nodeBottom > finalMaxX) finalMaxX = nodeBottom;
    });

    if (finalMinY === Infinity) finalMinY = -this.nodeBox.width / 2;
    if (finalMaxY === -Infinity) finalMaxY = this.nodeBox.width / 2;
    if (finalMinX === Infinity) finalMinX = -this.nodeBox.height / 2;
    if (finalMaxX === -Infinity) finalMaxX = this.nodeBox.height / 2;

    const calculatedTreeWidth = finalMaxY - finalMinY;
    const calculatedTreeHeight = finalMaxX - finalMinX;

    const svgWidth = calculatedTreeWidth + this.margin.left + this.margin.right;
    const svgHeight =
      calculatedTreeHeight + this.margin.top + this.margin.bottom;

    const svg = d3
      .select(element)
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    const g = svg
      .append('g')
      .attr(
        'transform',
        `translate(${-finalMinY + this.margin.left}, ${-finalMinX + this.margin.top})`,
      );

    const clipPathId = 'circle-mask';

    const defs = svg.append('defs');

    defs
      .append('clipPath')
      .attr('id', clipPathId)
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', this.imageSize / 2);

    const maxDepth = d3.max(root.descendants(), (d) => d.depth) ?? 0;
    const stageTitles = this.getStageTitles(maxDepth).reverse();

    const sortedStages = Array.from(stageYCoords.entries()).sort(
      (a, b) => a[0] - b[0],
    );

    g.append('g')
      .attr('class', 'stage-titles')
      .selectAll('text')
      .data(sortedStages)
      .join('text')
      .attr('x', (d) => d[1]) // Use the stored y-coordinate (which is now horizontal position)
      .attr('y', finalMinX - this.margin.top / 2) // Position above the bracket, adjusting based on margin
      .attr('dy', '0.31em') // Vertical alignment adjustment
      .attr('text-anchor', 'middle') // Center the text horizontally
      .attr('font-weight', 'bold')
      .attr('font-size', '14px') // Adjust font size as needed
      .attr('fill', '#555') // Adjust color as needed
      .text((d) => stageTitles[d[0]] || `Round ${d[0] + 1}`); // Use title or default

    const niceLinkGenerator = (d: d3.HierarchyLink<BracketNode>): string => {
      const source = d.source as d3.HierarchyPointNode<BracketNode>;
      const target = d.target as d3.HierarchyPointNode<BracketNode>;
      const maxTurnSize = 2;
      const pivotX = this.stageHorizontalSeparation / 2;
      const inflectY = (source.x - target.x) / 2;
      const curve = Math.min(Math.abs(pivotX), Math.abs(inflectY), maxTurnSize);
      const sign = inflectY > 0 ? 1 : -1;
      return (
        `M${target.y},${target.x}` +
        `H${source.y - pivotX - curve}` +
        `q${curve} 0 ${curve} ${sign * curve}` +
        `v${(inflectY - sign * curve) * 2}` +
        `q0 ${sign * curve} ${curve} ${sign * curve}` +
        `H${source.y}`
      );
    };

    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .filter(
        (d) =>
          !(d.source.data.type === 'match' && d.source.data?.matchDetails) ||
          (!!d.source.children &&
            d.target !== d.source.children[d.source.data.matchDetails.winner]),
      )
      .attr('fill', 'none')
      .attr('stroke', (d: d3.HierarchyLink<BracketNode>) =>
        d.source.data.type === 'match' && d.source.data.matchDetails
          ? 'lightcoral'
          : '#ccc',
      )
      .attr('stroke-width', (d: d3.HierarchyLink<BracketNode>) =>
        d.source.data.type === 'match' && d.source.data.matchDetails
          ? '1.95px'
          : '2px',
      )
      .attr('d', niceLinkGenerator);

    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .filter(
        (d) =>
          !!(d.source.data.type === 'match' && d.source.data?.matchDetails) &&
          d.target === d.source.children![d.source.data.matchDetails.winner],
      )
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

    node.each((d: d3.HierarchyNode<BracketNode>, i, nodes) => {
      const currentElement = nodes[i];
      const currentNode = d3.select(currentElement);

      currentNode
        .append('rect')
        .attr('fill', '#fff')
        .attr(
          'class',

          !d.parent ||
            (d.parent.data.type === 'match' && !d.parent.data.matchDetails)
            ? d.data.type === 'match' && d.data.matchDetails
              ? 'undecided'
              : 'empty'
            : d.parent.data.type === 'match' &&
                d.parent.data.matchDetails?.winner ===
                  d.parent.children!.indexOf(d)
              ? 'winner'
              : 'loser',
        )
        .attr(
          'width',
          `${d.parent?.y ? d.parent.y - d.y! - this.stageHorizontalSeparation : this.nodeBox.width}`,
        )
        .attr('height', `${this.nodeBox.height}px`)
        .attr('rx', this.nodeBox.radius)
        .attr('transform', `translate(0,${-this.nodeBox.height / 2})`);

      const teamData = getWinningTeam(d);
      //Team data
      if (teamData) {
        currentNode
          .append('foreignObject')
          .attr(
            'width',
            `${d.parent?.y ? d.parent.y - d.y! - this.stageHorizontalSeparation : this.nodeBox.width}`,
          )
          .attr('y', `${-this.nodeBox.height / 2}px`)
          .attr('height', `${this.nodeBox.height}px`)
          .append('xhtml:a')
          .attr('class', 'node-team')
          .attr('href', 'leagues/view/leagueidplaceholder/team/1')
          .html(`<div class="team-logo"><img src="${teamData.logo ?? ''}" /></div>
        <div class="team-info">
            <div class="team-name">${teamData.teamName}</div>
            <div class="coach-info">
                <span class="coach-name">${teamData.coachName}</span>
            </div>
        </div>
        <div class="team-score">${d.data.score ?? 0}</div>`);
      }
      //Placeholder text
      else {
        currentNode
          .append('text')
          .attr(
            'dx',
            d.parent
              ? (d.parent!.y! - d.y! - this.stageHorizontalSeparation) / 2
              : this.nodeBox.width / 2,
          )
          .attr('class', 'node-placeholder')
          .text(`Winner of ${(d as d3.HierarchyNode<MatchNode>).data.id}`)
          .clone(true)
          .lower()
          .attr('stroke-linejoin', 'round')
          .attr('stroke-width', 3)
          .attr('stroke', 'white');
      }

      //Game number or link
      if (d.parent && d.parent.children?.indexOf(d) === 0) {
        const parent = d.parent as d3.HierarchyNode<MatchNode>;
        (parent?.data.matchDetails
          ? currentNode
              .append('a')
              .attr('href', '#')
              .append('text')
              .attr(
                'dx',
                parent!.y! - d.y! - (this.stageHorizontalSeparation * 3) / 4,
              )
              .attr(
                'dy',
                `${(this.nodeBox.height + this.matchupVerticalSeparation) / 2}`,
              )
              .attr('text-anchor', 'middle')
              .attr('class', ' matchup-link')
              .text('link')
          : currentNode
              .append('text')
              .attr(
                'dx',
                parent!.y! - d.y! - (this.stageHorizontalSeparation * 3) / 4,
              )
              .attr(
                'dy',
                `${(this.nodeBox.height + this.matchupVerticalSeparation) / 2}`,
              )
              .attr('class', 'matchup-text')
              .text(`${parent!.data.id}`)
        )

          .clone(true)
          .lower()
          .attr('stroke-linejoin', 'round')
          .attr('stroke-width', 3)
          .attr('stroke', 'white');
      }

      //Seed text
      if (d.data.type === 'team') {
        currentNode
          .append('text')
          .attr('x', -this.margin.left / 2)
          .attr('class', 'seed')
          .text((d as d3.HierarchyNode<TeamNode>).data.team!.seed)
          .clone(true)
          .lower()
          .attr('stroke-linejoin', 'round')
          .attr('stroke-width', 3)
          .attr('stroke', 'white');
      }
    });
  }

  /**
   * Generates stage titles based on the maximum depth of the bracket.
   * @param maxDepth - The maximum depth of the hierarchy (0-based).
   * @returns An array of stage titles, ordered from earliest round to champion.
   */
  private getStageTitles(maxDepth: number): string[] {
    const standardTitles = [
      'Finals', // Depth maxDepth - 1
      'Champion', // Depth maxDepth (root)
    ];

    const rounds = [];
    let teams = 1; // Start with 2 teams in the final
    for (let depth = maxDepth - 1; depth >= 0; depth--) {
      teams *= 2; // Double teams for the previous round
      if (depth === maxDepth - 1) {
        rounds.push('Finals');
      } else if (depth === maxDepth - 2) {
        rounds.push('Semi-Finals');
      } else if (depth === maxDepth - 3) {
        rounds.push('Quarter-Finals');
      } else {
        rounds.push(`Round of ${teams}`);
      }
    }

    // Combine rounds and the Champion title
    // The order needs to match the depth: [Round of X, ..., Quarter-Finals, Semi-Finals, Finals, Champion]
    const titles = rounds.reverse(); // Reverse to match depth order (0 to maxDepth)
    titles.push('Champion'); // Add Champion for the final node (depth 0 in original hierarchy, but max depth visually)

    // The titles array should now align with depths [0, 1, 2, ..., maxDepth]
    // Example for maxDepth = 4 (16 teams -> 5 stages including champion):
    // Depth 0: Round of 16
    // Depth 1: Quarter-Finals
    // Depth 2: Semi-Finals
    // Depth 3: Finals
    // Depth 4: Champion
    // We need to return titles ordered by depth for lookup:
    const depthTitles: string[] = [];
    let currentTeams = Math.pow(2, maxDepth); // Total teams for the first round (depth 0)

    for (let i = 0; i <= maxDepth; i++) {
      if (i === maxDepth) {
        depthTitles.push('Champion');
      } else if (i === maxDepth - 1) {
        depthTitles.push('Finals');
      } else if (i === maxDepth - 2) {
        depthTitles.push('Semi-Finals');
      } else if (i === maxDepth - 3) {
        depthTitles.push('Quarter-Finals');
      } else {
        depthTitles.push(`Round of ${currentTeams}`);
      }
      currentTeams /= 2;
    }
    return depthTitles;
  }
}

function getWinningTeam(
  node: d3.HierarchyNode<BracketNode>,
): BracketTeamData | null {
  if (node.data.type === 'team') {
    return node.data.team;
  }
  if (
    !node.data.matchDetails ||
    !node.children ||
    node.children.length <= node.data.matchDetails.winner
  )
    return null;
  return getWinningTeam(node.children[node.data.matchDetails.winner]);
}
