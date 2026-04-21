import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getLogoUrl } from '../../league.util';

// ─── Public Data Model ────────────────────────────────────────────────────────

export type BracketSlotFlex =
  | { type: 'seed'; seed: number }
  | { type: 'winner'; from: string }
  | { type: 'loser'; from: string }
  | { type: 'bye'; seed: number };

export interface BracketTeamFlex {
  teamName: string;
  coachName: string;
  seed: number;
  logo?: string;
  divisionKey?: string;
  teamId?: string;
}

export interface FlexBracketMatch {
  id: string;
  /** Column index (left = earlier rounds). Within a section, rounds are numbered independently. */
  round: number;
  /** Row index within the round. 0-indexed, used to determine vertical ordering of leaf matches. */
  position: number;
  /** Groups matches into visual sections (e.g. 'winners', 'losers', 'finals'). Defaults to 'main'. */
  section?: string;
  a: BracketSlotFlex;
  b: BracketSlotFlex;
  winner?: 0 | 1;
  replay?: string;
  /** Override the auto-generated match label. */
  label?: string;
}

export interface FlexBracketSectionConfig {
  key: string;
  /** Display title above the section. Omit or leave empty to hide. */
  title?: string;
  /** Controls vertical ordering of sections. Lower = higher. */
  order?: number;
  /** Per-round title overrides keyed by round number. */
  roundTitles?: Record<number, string>;
}

export interface FlexBracketData {
  format?: 'single-elim' | 'double-elim' | 'custom';
  teams: BracketTeamFlex[];
  matches: FlexBracketMatch[];
  sections?: FlexBracketSectionConfig[];
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface ResolvedSlot {
  team: BracketTeamFlex | null;
  placeholder: string | null;
}

interface LayoutMatch {
  id: string;
  section: string;
  round: number;
  position: number;
  slotA: ResolvedSlot;
  slotB: ResolvedSlot;
  winner?: 0 | 1;
  replay?: string;
  label: string;
  /** Vertical pixel center within the round column, used for absolute positioning. */
  verticalCenter: number;
  /** CSS `top` offset for the match card. */
  cardTop: number;
}

interface LayoutRound {
  roundNum: number;
  title: string;
  matches: LayoutMatch[];
}

export interface LayoutSection {
  key: string;
  title: string;
  rounds: LayoutRound[];
  /** Total pixel height required for this section's round columns. */
  height: number;
}

interface ConnectorPath {
  d: string;
  cls: 'winner' | 'loser' | 'neutral';
}

// ─── Layout Constants ─────────────────────────────────────────────────────────

/** Approximate rendered height of one match card (label + 2 team rows + padding). */
const MATCH_H = 140;
/** Minimum gap between match cards in the first (leaf) round. */
const MATCH_GAP_BASE = 16;

@Component({
  selector: 'pdz-league-bracket-flex',
  imports: [CommonModule, RouterModule],
  templateUrl: './league-bracket-flex.component.html',
  styleUrl: './league-bracket-flex.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueBracketFlexComponent
  implements OnChanges, AfterViewChecked, OnDestroy
{
  @Input() componentTitle: string = 'Playoff Bracket';
  @Input() bracketData?: FlexBracketData;
  @Input() tournamentKey?: string;

  @ViewChild('bracketContent') private bracketContent!: ElementRef<HTMLElement>;

  layoutSections: LayoutSection[] = [];
  connectorPaths: ConnectorPath[] = [];
  svgWidth = 0;
  svgHeight = 0;

  private needsPathUpdate = false;
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly getLogoUrl = getLogoUrl;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bracketData']) {
      this.computeLayout();
      this.needsPathUpdate = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsPathUpdate && this.bracketContent?.nativeElement) {
      this.needsPathUpdate = false;
      this.updateConnectorPaths();
    }
  }

  ngOnDestroy(): void {}

  // ─── Layout Computation ───────────────────────────────────────────────────

  private computeLayout(): void {
    if (!this.bracketData) {
      this.layoutSections = [];
      return;
    }

    const { teams, matches, sections: sectionCfgs } = this.bracketData;
    const verticalCenters = this.computeVerticalCenters(matches);

    // Determine section keys and their ordering
    const sectionKeys = [...new Set(matches.map((m) => m.section ?? 'main'))];
    const sectionOrderMap = new Map<string, number>();
    sectionCfgs?.forEach((s, i) => sectionOrderMap.set(s.key, s.order ?? i));
    sectionKeys.forEach((k, i) => {
      if (!sectionOrderMap.has(k)) sectionOrderMap.set(k, 1000 + i);
    });
    sectionKeys.sort(
      (a, b) => (sectionOrderMap.get(a) ?? 0) - (sectionOrderMap.get(b) ?? 0),
    );

    this.layoutSections = sectionKeys.map((sKey) => {
      const cfg = sectionCfgs?.find((s) => s.key === sKey);
      const sectionMatches = matches.filter(
        (m) => (m.section ?? 'main') === sKey,
      );

      const roundMap = new Map<number, FlexBracketMatch[]>();
      sectionMatches.forEach((m) => {
        roundMap.set(m.round, [...(roundMap.get(m.round) ?? []), m]);
      });

      const roundNums = [...roundMap.keys()].sort((a, b) => a - b);
      const totalTeams = this.bracketData!.teams.length;
      const roundTitles = this.computeRoundTitles(
        roundNums,
        sKey,
        totalTeams,
        cfg?.roundTitles,
      );

      const rounds: LayoutRound[] = roundNums.map((rn, idx) => {
        const rawMatches = roundMap
          .get(rn)!
          .sort((a, b) => a.position - b.position);
        const layoutMatches: LayoutMatch[] = rawMatches.map((m) => {
          const vc = verticalCenters.get(m.id) ?? 0;
          return {
            id: m.id,
            section: m.section ?? 'main',
            round: m.round,
            position: m.position,
            slotA: this.resolveSlot(m.a, teams, matches),
            slotB: this.resolveSlot(m.b, teams, matches),
            winner: m.winner,
            replay: m.replay,
            label: m.label ?? `Match ${m.id}`,
            verticalCenter: vc,
            cardTop: vc - MATCH_H / 2,
          };
        });
        return {
          roundNum: rn,
          title: roundTitles[idx],
          matches: layoutMatches,
        };
      });

      const height = Math.max(
        MATCH_H,
        ...rounds.flatMap((r) =>
          r.matches.map((m) => m.verticalCenter + MATCH_H / 2),
        ),
      );

      return {
        key: sKey,
        title: cfg?.title ?? this.autoSectionTitle(sKey),
        rounds,
        height,
      };
    });
  }

  /**
   * Topologically assigns vertical centers to all matches.
   *
   * - Leaf matches (seed/bye inputs only) get their center from `position * stride`.
   * - Non-leaf matches are centered at the average of their source match centers.
   *
   * This produces the natural staggered pyramid effect for any bracket topology.
   */
  private computeVerticalCenters(
    matches: FlexBracketMatch[],
  ): Map<string, number> {
    const centers = new Map<string, number>();
    const matchById = new Map(matches.map((m) => [m.id, m]));

    const getInputIds = (m: FlexBracketMatch): string[] => {
      const ids: string[] = [];
      if (m.a.type === 'winner' || m.a.type === 'loser') ids.push(m.a.from);
      if (m.b.type === 'winner' || m.b.type === 'loser') ids.push(m.b.from);
      return ids;
    };

    const visited = new Set<string>();
    const order: FlexBracketMatch[] = [];
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const m = matchById.get(id);
      if (m) {
        getInputIds(m).forEach(visit);
        order.push(m);
      }
    };
    matches.forEach((m) => visit(m.id));

    for (const m of order) {
      const inputIds = getInputIds(m);
      const resolved = inputIds
        .map((id) => centers.get(id))
        .filter((c): c is number => c !== undefined);

      if (resolved.length >= 2) {
        centers.set(
          m.id,
          resolved.reduce((a, b) => a + b, 0) / resolved.length,
        );
      } else if (resolved.length === 1) {
        centers.set(m.id, resolved[0]);
      } else {
        // Leaf match: position-based spacing within its section
        centers.set(
          m.id,
          m.position * (MATCH_H + MATCH_GAP_BASE) + MATCH_H / 2,
        );
      }
    }

    // Normalize so the topmost card always starts at top:0, regardless of
    // whether position values are 0-indexed, 1-indexed, or sparse.
    if (centers.size > 0) {
      const minCenter = Math.min(...centers.values());
      const offset = minCenter - MATCH_H / 2;
      if (offset !== 0) {
        centers.forEach((v, k) => centers.set(k, v - offset));
      }
    }

    return centers;
  }

  /**
   * Resolves a slot to its actual team by recursively following winner/loser chains.
   * Returns a placeholder when the source match has not yet been played.
   */
  private resolveSlot(
    slot: BracketSlotFlex,
    teams: BracketTeamFlex[],
    allMatches: FlexBracketMatch[],
    depth = 0,
  ): ResolvedSlot {
    if (depth > 20) return { team: null, placeholder: 'TBD' };

    if (slot.type === 'seed' || slot.type === 'bye') {
      const team = teams.find((t) => t.seed === slot.seed) ?? null;
      return { team, placeholder: team ? null : `Seed ${slot.seed}` };
    }

    if (slot.type === 'winner') {
      const src = allMatches.find((m) => m.id === slot.from);
      if (src?.winner !== undefined) {
        const advancingSlot = src.winner === 0 ? src.a : src.b;
        return this.resolveSlot(advancingSlot, teams, allMatches, depth + 1);
      }
      return { team: null, placeholder: `Winner of Match ${slot.from}` };
    }

    if (slot.type === 'loser') {
      const src = allMatches.find((m) => m.id === slot.from);
      if (src?.winner !== undefined) {
        const eliminatedSlot = src.winner === 0 ? src.b : src.a;
        return this.resolveSlot(eliminatedSlot, teams, allMatches, depth + 1);
      }
      return { team: null, placeholder: `L of ${slot.from}` };
    }

    return { team: null, placeholder: null };
  }

  private computeRoundTitles(
    roundNums: number[],
    sectionKey: string,
    totalTeams: number,
    overrides?: Record<number, string>,
  ): string[] {
    const n = roundNums.length;
    const isWinners = sectionKey === 'main' || sectionKey === 'winners';
    const isFinals = sectionKey === 'finals' || sectionKey === 'grand-finals';

    return roundNums.map((rn, idx) => {
      if (overrides?.[rn]) return overrides[rn];
      const fromEnd = n - 1 - idx;
      if (isFinals) {
        return fromEnd === 0 ? 'Grand Finals' : 'Grand Finals Reset';
      }
      if (isWinners) {
        if (fromEnd === 0) return 'Finals';
        if (fromEnd === 1) return 'Semi-Finals';
        if (fromEnd === 2) return 'Quarter-Finals';
        const roundOf = Math.min(Math.pow(2, fromEnd + 1), totalTeams);
        return `Round of ${roundOf}`;
      }
      return `Round ${idx + 1}`;
    });
  }

  private autoSectionTitle(key: string): string {
    const titles: Record<string, string> = {
      main: '',
      winners: 'Winners Bracket',
      losers: 'Losers Bracket',
      finals: 'Grand Finals',
      'grand-finals': 'Grand Finals',
    };
    return titles[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
  }

  // ─── SVG Path Computation ─────────────────────────────────────────────────

  private updateConnectorPaths(): void {
    const container = this.bracketContent?.nativeElement;
    if (!container || !this.bracketData) {
      this.connectorPaths = [];
      return;
    }

    const containerRect = container.getBoundingClientRect();
    this.svgWidth = container.scrollWidth;
    this.svgHeight = container.scrollHeight;

    const getMatchEl = (id: string) =>
      container.querySelector<HTMLElement>(
        `[data-match-id="${CSS.escape(id)}"]`,
      );

    const paths: ConnectorPath[] = [];
    const matchById = new Map(this.bracketData.matches.map((m) => [m.id, m]));

    for (const match of this.bracketData.matches) {
      const destEl = getMatchEl(match.id);
      if (!destEl) continue;

      const slots = [
        { slot: match.a, slotIndex: 0 },
        { slot: match.b, slotIndex: 1 },
      ] as const;

      for (const { slot, slotIndex } of slots) {
        if (slot.type !== 'winner' && slot.type !== 'loser') continue;

        const sourceEl = getMatchEl(slot.from);
        if (!sourceEl) continue;

        const sourceRect = sourceEl.getBoundingClientRect();
        const srcX = sourceRect.right - containerRect.left;
        const srcY = sourceRect.top + sourceRect.height / 2 - containerRect.top;

        // Connect to the vertical center of the specific team slot on the dest card
        const slotEl = destEl.querySelector<HTMLElement>(
          `[data-slot="${slotIndex}"]`,
        );
        const destTargetRect = (slotEl ?? destEl).getBoundingClientRect();
        const destX = destTargetRect.left - containerRect.left;
        const destY =
          destTargetRect.top + destTargetRect.height / 2 - containerRect.top;

        const sourceMatch = matchById.get(slot.from);
        let cls: 'winner' | 'loser' | 'neutral' = 'neutral';
        if (sourceMatch?.winner !== undefined) {
          cls = slot.type === 'winner' ? 'winner' : 'loser';
        }

        paths.push({ d: this.buildPath(srcX, srcY, destX, destY), cls });
      }
    }

    this.connectorPaths = paths;
    this.cdr.markForCheck();
  }

  /** Builds a rounded-elbow SVG path between two points. */
  private buildPath(x1: number, y1: number, x2: number, y2: number): string {
    const midX = (x1 + x2) / 2;
    const dy = y2 - y1;
    const r = Math.min(6, Math.abs(dy) / 2, Math.abs(midX - x1) / 2);

    if (Math.abs(dy) < 2) return `M${x1},${y1}H${x2}`;

    const s = dy > 0 ? 1 : -1;
    return [
      `M${x1},${y1}`,
      `H${midX - r}`,
      `q${r},0 ${r},${s * r}`,
      `V${y2 - s * r}`,
      `q0,${s * r} ${r},${s * r}`,
      `H${x2}`,
    ].join('');
  }

  // ─── Template Helpers ─────────────────────────────────────────────────────

  getTeamStatus(
    match: LayoutMatch,
    slotIndex: 0 | 1,
  ): 'winner' | 'loser' | 'undecided' {
    if (match.winner === undefined) return 'undecided';
    return match.winner === slotIndex ? 'winner' : 'loser';
  }

  getTeamUrl(team: BracketTeamFlex | null): string {
    if (!team?.divisionKey || !team.teamId || !this.tournamentKey) return '#';
    return `/leagues/pdbl/tournaments/${this.tournamentKey}/divisions/${team.divisionKey}/teams/${team.teamId}`;
  }
}
