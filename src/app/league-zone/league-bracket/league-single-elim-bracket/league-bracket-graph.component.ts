import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import * as d3 from 'd3';
import { getLogoUrl } from '../../league.util';

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

type SeedSlot = { type: 'seed'; seed: number };
type WinnerSlot = { type: 'winner'; from: string };
type LoserSlot = { type: 'loser'; from: string };
type ByeSlot = { type: 'bye'; seed: number };

type BracketSlot = SeedSlot | WinnerSlot | ByeSlot | LoserSlot;

interface BracketMatch {
  id: string;
  round: number;
  position: number;
  a: BracketSlot;
  b: BracketSlot;
  winner?: 0 | 1;
  replay?: string;
}

export interface BracketDataNormalized {
  format: 'single-elim';
  teams: BracketTeamData[];
  matches: BracketMatch[];
}

@Component({
  imports: [RouterModule],
  selector: 'pdz-league-single-elim-bracket',
  templateUrl: './league-bracket-graph.component.html',
  styleUrl: './league-bracket-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueBracketGraphComponent implements AfterViewInit, OnChanges {
  @Input() componentTitle: string = 'Tournament Bracket (Single Elimination)';
  @Input() bracketData?: BracketDataNormalized;

  @Input() maxWidth: number = 1200;
  @Input() maxHeight: number = 1600;
  @Input() margin = { top: 50, right: 10, bottom: 10, left: 10 };
  imageSize = 24;
  @ViewChild('bracketSvgContainer') private bracketContainer!: ElementRef;

  private hasViewInitialized = false;

  matchupVerticalSeparation = 12;
  stageHorizontalSeparation = 72;
  nodeBox = { height: 56, width: 220, radius: 10 };

  private readonly getLogoUrl = getLogoUrl;

  ngAfterViewInit(): void {
    this.hasViewInitialized = true;
    this.renderBracket();
  }

  buildBracketTree(data: BracketDataNormalized): BracketNode {
    const matchMap = new Map<string, { id: number; match: BracketMatch }>();
    data.matches.forEach((m, index) =>
      matchMap.set(m.id, { id: index + 1, match: m }),
    );
    const cache = new Map<string, MatchNode>();

    const slotToNode = (slot: BracketSlot): BracketNode => {
      if (slot.type === 'seed') {
        const team = data.teams.find((t) => t.seed === slot.seed);
        if (!team) {
          return {
            type: 'team',
            team: {
              teamName: `Unknown #${slot.seed}`,
              coachName: '-',
              seed: slot.seed,
            },
          };
        }
        return { type: 'team', team };
      }
      if (slot.type === 'bye') {
        const team = data.teams.find((t) => t.seed === slot.seed);
        return {
          type: 'team',
          team: team ?? {
            teamName: `Unknown #${slot.seed}`,
            coachName: '-',
            seed: slot.seed,
          },
        };
      }
      return buildMatchNode(slot.from);
    };

    const buildMatchNode = (id: string): MatchNode => {
      if (cache.has(id)) return cache.get(id)!;
      const entry = matchMap.get(id);
      if (!entry) {
        const placeholder: MatchNode = {
          type: 'match',
          id: undefined,
          children: [],
        };
        return placeholder;
      }
      const node: MatchNode = {
        type: 'match',
        id: entry.id || undefined,
        matchDetails:
          entry.match.winner !== undefined
            ? { winner: entry.match.winner, replay: entry.match.replay }
            : undefined,
        children: [slotToNode(entry.match.a), slotToNode(entry.match.b)],
      };
      cache.set(id, node);
      return node;
    };

    const final = data.matches.reduce(
      (best, m) => (!best || m.round > best.round ? m : best),
      undefined as BracketMatch | undefined,
    );
    if (!final) throw new Error('No matches in bracket');
    return buildMatchNode(final.id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bracketData'] || changes['maxWidth'] || changes['maxHeight']) {
      this.renderBracket();
    }
  }

  private renderBracket(): void {
    if (!this.hasViewInitialized || !this.bracketContainer?.nativeElement) {
      return;
    }

    if (!this.bracketData) {
      d3.select(this.bracketContainer.nativeElement).selectAll('*').remove();
      return;
    }

    this.createBracket(this.buildBracketTree(this.bracketData));
  }

  private createBracket(bracketData: BracketNode): void {
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

    const root = d3.hierarchy(bracketData);
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
      .attr('x', (d) => d[1])
      .attr('y', finalMinX - this.margin.top / 2)
      .attr('dy', '0.31em')
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .attr('fill', 'var(--pdz-color-on-surface-variant)')
      .text((d) => stageTitles[d[0]] || `Round ${d[0] + 1}`);

    const childToMidPath = (d: d3.HierarchyLink<BracketNode>): string => {
      const parent = d.source as d3.HierarchyPointNode<BracketNode>;
      const child = d.target as d3.HierarchyPointNode<BracketNode>;
      const maxTurnSize = 2;
      const midY = parent.y! - this.stageHorizontalSeparation / 2;
      const verticalOffset = (parent.x! - child.x!) / 2;
      const curve = Math.min(
        Math.abs(this.stageHorizontalSeparation / 2),
        Math.abs(verticalOffset),
        maxTurnSize,
      );
      const sign = verticalOffset > 0 ? 1 : -1;

      return (
        `M${child.y},${child.x}` +
        `H${midY - curve}` +
        `q${curve} 0 ${curve} ${sign * curve}` +
        `v${(verticalOffset - sign * curve) * 2}` +
        `q0 ${sign * curve} ${curve} ${sign * curve}`
      );
    };

    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', (d: d3.HierarchyLink<BracketNode>) => {
        const parent = d.source;
        if (parent.data.type !== 'match' || !parent.data.matchDetails) {
          return 'var(--pdz-color-outline-variant)';
        }
        const isWinner =
          parent.children &&
          d.target === parent.children[parent.data.matchDetails.winner];
        return isWinner
          ? 'var(--pdz-color-positive)'
          : 'var(--pdz-color-negative)';
      })
      .attr('stroke-width', '2px')
      .attr('d', childToMidPath);

    const parentsWithChildren = root
      .descendants()
      .filter((d) => d.children && d.children.length > 0);

    g.selectAll('.link-shared')
      .data(parentsWithChildren)
      .join('path')
      .attr('class', 'link-shared')
      .attr('fill', 'none')
      .attr('stroke', 'var(--pdz-color-outline-variant)')
      .attr('stroke-width', '2px')
      .attr('d', (d) => {
        const node = d as d3.HierarchyPointNode<BracketNode>;
        return `M${node.y! - this.stageHorizontalSeparation / 2},${node.x}H${node.y}`;
      });

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
          .attr('href', 'leagues/view/tournamentIdplaceholder/team/1')
          .html(`<div class="team-logo"><img src="${this.getLogoUrl(teamData.logo)}" /></div>
        <div class="team-info">
            <div class="team-name">${teamData.teamName}</div>
            <div class="coach-info">
                <span class="seed-number">${teamData.seed}</span>
                <span class="coach-name">${teamData.coachName}</span>
            </div>
        </div>
        <div class="team-score">${d.data.score ?? 0}</div>`);
      } else {
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
    });
  }

  private getStageTitles(maxDepth: number): string[] {
    const depthTitles: string[] = [];
    let currentTeams = Math.pow(2, maxDepth);

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
