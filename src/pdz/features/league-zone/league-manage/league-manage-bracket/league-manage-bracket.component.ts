import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import {
  GeneratedBracket,
  fullRoundRobinCycle,
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  offsetBracket,
  toBracketPayload,
  validateBracketWiring,
} from '../../league-bracket/bracket-generator';
import {
  BracketSlotFlex,
  BracketTeamFlex,
  FlexBracketMatch,
  FlexBracketSectionConfig,
} from '../../league-bracket/bracket.model';
import { LeagueBracketCanvasComponent } from '../../league-bracket/league-bracket-canvas/league-bracket-canvas.component';
import {
  BracketWithSeeding,
  LeagueZoneService,
} from '../../league-zone.service';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';
import { LeagueManageService } from '../league-manage.service';

interface TeamOption {
  id: string;
  teamName: string;
  coachName: string;
  logo?: string;
  draft: { draftSlug: string; name: string } | null;
}

export type SectionFormat =
  | 'single-elim'
  | 'double-elim'
  | 'round-robin'
  | 'blank';

/**
 * One configured block of the bracket. Each owns a contiguous slice of the
 * bracket's global seed numbering (`seedBase+1 … seedBase+teamIds.length`),
 * which is what lets the server shuffle a random block among its own teams
 * without disturbing any other block.
 */
interface SectionDraft {
  id: string;
  name: string;
  format: SectionFormat;
  /** Participating teams, in organizer order. Ignored as an order when random. */
  teamIds: string[];
  random: boolean;
  /** Round-robin only. */
  rounds: number;
  /** Double-elimination only. */
  grandFinalsReset: boolean;
  seedBase: number;
  /** Namespaced section keys this block put on the canvas. */
  sectionKeys: string[];
}

/** A team row in the add-section form: every approved team, orderable. */
interface FormTeamRow {
  team: TeamOption;
  selected: boolean;
}

const FORMAT_LABELS: Record<SectionFormat, string> = {
  'single-elim': 'Single Elimination',
  'double-elim': 'Double Elimination',
  'round-robin': 'Round Robin',
  blank: 'Blank (build by hand)',
};

@Component({
  selector: 'pdz-league-manage-bracket',
  imports: [CommonModule, LoadingComponent, LeagueBracketCanvasComponent],
  templateUrl: './league-manage-bracket.component.html',
  styleUrl: './league-manage-bracket.component.scss',
})
export class LeagueManageBracketComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly manageService = inject(LeagueManageService);

  protected readonly getLogoUrl = getLogoUrl;
  protected readonly formatLabels = FORMAT_LABELS;
  readonly formats: SectionFormat[] = [
    'single-elim',
    'double-elim',
    'round-robin',
    'blank',
  ];

  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;

  stage: League.StageSummary | null = null;
  bracket: BracketWithSeeding | null = null;

  /** Every approved team in the tournament. */
  teams: TeamOption[] = [];

  /** Configured blocks, in the order they were added (= seed order). */
  sections: SectionDraft[] = [];

  /** Bound to the canvas. Replaced only when a block is added or removed. */
  templateMatches: FlexBracketMatch[] = [];
  templateSections: FlexBracketSectionConfig[] = [];

  /**
   * The canvas's live draft, including hand edits. Kept separate from the
   * bound inputs above so echoing it back doesn't reset the canvas.
   */
  private composed: GeneratedBracket = { matches: [], sections: [] };

  // ─── Add-section form ──────────────────────────────────────────────────────

  formOpen = false;
  formName = '';
  formFormat: SectionFormat = 'single-elim';
  formRandom = true;
  formRounds = 1;
  private formRoundsTouched = false;
  formGrandFinalsReset = true;
  formTeamRows: FormTeamRow[] = [];

  get stageId(): string | null {
    return this.leagueService.stageId();
  }

  get hasBracket(): boolean {
    return (this.bracket?.matches?.length ?? 0) > 0;
  }

  /** Mirrors the server's BRACKET_STAGE_TYPES — other types reject a bracket. */
  get supportsBracket(): boolean {
    return (
      this.stage === null ||
      ['single-elimination', 'double-elimination', 'custom'].includes(
        this.stage.type,
      )
    );
  }

  /** A blank section has no matches yet, but still needs the canvas shown. */
  get hasSections(): boolean {
    return this.sections.length > 0 || this.composed.matches.length > 0;
  }

  ngOnInit(): void {
    const stageId = this.stageId;
    if (!stageId) return;

    this.leagueService.listStages().subscribe((stages) => {
      this.stage = stages.find((s) => s._id === stageId) ?? null;
      // Seed the first section's format from the stage type — the organizer
      // picked it when creating the stage, so it's the likely first block.
      if (this.stage?.type === 'double-elimination')
        this.formFormat = 'double-elim';
      else if (this.stage?.type === 'single-elimination')
        this.formFormat = 'single-elim';
    });

    this.loadBracket();

    this.leagueService.getTournamentTeams().subscribe(({ teams }) => {
      this.teams = teams
        .filter((t) => t.status === 'approved')
        .map(({ id, teamName, coachName, logo, draft }) => ({
          id,
          teamName,
          coachName,
          logo,
          draft,
        }));
      if (this.formOpen) this.resetFormTeams();
    });
  }

  private loadBracket(): void {
    if (!this.stageId) return;
    this.leagueService.getStageBracket(this.stageId).subscribe({
      next: (bracket) => {
        this.bracket = bracket;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  // ─── Seed bookkeeping ──────────────────────────────────────────────────────

  /** Total seed numbers handed out, including any freed by a removed block. */
  private get seedCeiling(): number {
    return this.sections.reduce(
      (max, section) => Math.max(max, section.seedBase + section.teamIds.length),
      0,
    );
  }

  /** Highest seed the canvas may offer. Gaps from removed blocks are harmless. */
  get seedCount(): number {
    return this.seedCeiling;
  }

  /**
   * Seeds whose team is public. Random blocks are withheld: the organizer must
   * not see (or be able to influence) placements before the server draws them.
   */
  get builderTeams(): BracketTeamFlex[] {
    const teamById = new Map(this.teams.map((t) => [t.id, t]));
    return this.sections
      .filter((section) => !section.random)
      .flatMap((section) =>
        section.teamIds.flatMap((teamId, idx) => {
          const team = teamById.get(teamId);
          if (!team) return [];
          return [
            {
              seed: section.seedBase + idx + 1,
              teamName: team.teamName,
              coachName: team.coachName,
              logo: team.logo,
              teamId: team.id,
            },
          ];
        }),
      );
  }

  teamName(teamId: string): string {
    return this.teams.find((t) => t.id === teamId)?.teamName ?? 'Unknown team';
  }

  /** Teams already claimed by a block — a team may only enter the stage once. */
  private get claimedTeamIds(): Set<string> {
    return new Set(this.sections.flatMap((section) => section.teamIds));
  }

  // ─── Add-section form ──────────────────────────────────────────────────────

  openForm(): void {
    this.formOpen = true;
    this.formName = '';
    this.formRandom = true;
    this.formRoundsTouched = false;
    this.formGrandFinalsReset = true;
    this.resetFormTeams();
  }

  closeForm(): void {
    this.formOpen = false;
  }

  /** Unclaimed teams, all pre-selected — the common case is "everyone left". */
  private resetFormTeams(): void {
    const claimed = this.claimedTeamIds;
    this.formTeamRows = this.teams
      .filter((team) => !claimed.has(team.id))
      .map((team) => ({ team, selected: true }));
    this.syncDefaultRounds();
  }

  setFormFormat(format: string): void {
    this.formFormat = format as SectionFormat;
    this.syncDefaultRounds();
  }

  setFormRandom(checked: boolean): void {
    this.formRandom = checked;
  }

  setFormGrandFinalsReset(checked: boolean): void {
    this.formGrandFinalsReset = checked;
  }

  setFormRounds(value: string): void {
    const rounds = Math.floor(Number(value));
    if (!Number.isFinite(rounds) || rounds < 1) return;
    this.formRounds = rounds;
    this.formRoundsTouched = true;
  }

  private syncDefaultRounds(): void {
    if (this.formRoundsTouched) return;
    const count = this.formSelectedIds.length;
    this.formRounds = count >= 2 ? fullRoundRobinCycle(count) : 1;
  }

  toggleFormTeam(teamId: string): void {
    const row = this.formTeamRows.find((r) => r.team.id === teamId);
    if (!row) return;
    row.selected = !row.selected;
    this.syncDefaultRounds();
  }

  moveFormTeam(index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= this.formTeamRows.length) return;
    const rows = [...this.formTeamRows];
    [rows[index], rows[target]] = [rows[target], rows[index]];
    this.formTeamRows = rows;
  }

  get formSelectedIds(): string[] {
    return this.formTeamRows.filter((r) => r.selected).map((r) => r.team.id);
  }

  get formSelectedCount(): number {
    return this.formSelectedIds.length;
  }

  get canAddSection(): boolean {
    if (!this.formName.trim()) return false;
    // A blank section is hand-wired later, so it may start with no teams.
    return this.formFormat === 'blank' || this.formSelectedCount >= 2;
  }

  addSection(): void {
    if (!this.canAddSection) return;
    this.errorMessage = null;

    const teamIds = this.formSelectedIds;
    const name = this.formName.trim();
    const id = this.uniqueSectionId(name);
    const seedBase = this.seedCeiling;

    const generated = this.generateFor(this.formFormat, teamIds.length, {
      rounds: this.formRounds,
      grandFinalsReset: this.formGrandFinalsReset,
    });
    const block = offsetBracket(generated, {
      prefix: id,
      seedOffset: seedBase,
      title: name,
      orderBase: this.composed.sections.length,
    });

    const section: SectionDraft = {
      id,
      name,
      format: this.formFormat,
      teamIds,
      random: this.formRandom,
      rounds: this.formRounds,
      grandFinalsReset: this.formGrandFinalsReset,
      seedBase,
      sectionKeys: block.sections.map((s) => s.key),
    };

    this.sections = [...this.sections, section];
    this.pushToCanvas({
      matches: [...this.composed.matches, ...block.matches],
      sections: [...this.composed.sections, ...block.sections],
    });
    this.formOpen = false;
  }

  private generateFor(
    format: SectionFormat,
    teamCount: number,
    options: { rounds: number; grandFinalsReset: boolean },
  ): GeneratedBracket {
    switch (format) {
      case 'double-elim':
        return generateDoubleElimination(teamCount, {
          grandFinalsReset: options.grandFinalsReset,
        });
      case 'round-robin':
        return generateRoundRobin(teamCount, options.rounds);
      case 'single-elim':
        return generateSingleElimination(teamCount);
      case 'blank':
        return {
          matches: [],
          sections: [{ key: 'main', kind: 'main', teamCount }],
        };
    }
  }

  private uniqueSectionId(name: string): string {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    let unique = base;
    let n = 2;
    while (this.sections.some((s) => s.id === unique)) unique = `${base}-${n++}`;
    return unique;
  }

  removeSection(sectionId: string): void {
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;
    if (
      !confirm(
        `Remove "${section.name}"? Its matchups and rounds are discarded, and ` +
          'its teams become available again.',
      )
    ) {
      return;
    }

    const keys = new Set(section.sectionKeys);
    const removedIds = new Set(
      this.composed.matches
        .filter((m) => keys.has(m.section ?? 'main'))
        .map((m) => m.id),
    );
    // A surviving match may point at one that just went away — leave the slot
    // unassigned rather than a dangling reference (the same rule deleteMatch
    // applies on the canvas).
    const clearRef = (slot: BracketSlotFlex): BracketSlotFlex =>
      (slot.type === 'winner' || slot.type === 'loser') &&
      removedIds.has(slot.from)
        ? { type: 'empty' }
        : slot;

    this.sections = this.sections.filter((s) => s.id !== sectionId);
    this.pushToCanvas({
      matches: this.composed.matches
        .filter((m) => !keys.has(m.section ?? 'main'))
        .map((m) => ({ ...m, a: clearRef(m.a), b: clearRef(m.b) })),
      sections: this.composed.sections.filter((s) => !keys.has(s.key)),
    });
  }

  /** New array identities reseed the canvas's draft from this content. */
  private pushToCanvas(draft: GeneratedBracket): void {
    this.composed = draft;
    this.templateMatches = [...draft.matches];
    this.templateSections = [...draft.sections];
  }

  onDraftChanged(draft: GeneratedBracket): void {
    this.composed = draft;
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  /**
   * Maps the seeds actually wired into the bracket onto a dense 1..N range and
   * splits them back into per-block groups. Removing a block (or deleting the
   * matches that used a seed) leaves holes in the global numbering, which the
   * server rejects — compacting here keeps those edits legal.
   */
  private buildSeedGroups(matches: FlexBracketMatch[]):
    | {
        groups: {
          teamIds: string[];
          method: 'certified-random' | 'manual';
          label?: string;
        }[];
        remap: Map<number, number>;
      }
    | { error: string } {
    const used = new Set<number>();
    for (const match of matches) {
      for (const slot of [match.a, match.b]) {
        if (slot.type === 'seed' || slot.type === 'bye') used.add(slot.seed);
      }
    }

    const remap = new Map<number, number>();
    const groups: {
      teamIds: string[];
      method: 'certified-random' | 'manual';
      label?: string;
    }[] = [];
    let next = 1;

    for (const section of [...this.sections].sort(
      (a, b) => a.seedBase - b.seedBase,
    )) {
      const teamIds: string[] = [];
      section.teamIds.forEach((teamId, idx) => {
        const seed = section.seedBase + idx + 1;
        if (!used.has(seed)) return;
        remap.set(seed, next++);
        teamIds.push(teamId);
      });
      if (teamIds.length === 0) continue;
      groups.push({
        teamIds,
        method: section.random ? 'certified-random' : 'manual',
        label: section.name,
      });
    }

    const orphan = [...used].find((seed) => !remap.has(seed));
    if (orphan !== undefined) {
      return {
        error:
          `Seed ${orphan} isn't part of any section. Re-point that slot, or ` +
          're-add the section it belonged to.',
      };
    }
    return { groups, remap };
  }

  saveBracket(bracket: GeneratedBracket): void {
    if (!this.stageId || this.isSaving) return;
    this.errorMessage = null;

    if (bracket.matches.length === 0) {
      this.errorMessage = 'Add at least one section with matches.';
      return;
    }
    const errors = validateBracketWiring(bracket.matches, bracket.sections);
    if (errors.length > 0) {
      this.errorMessage = errors.join(' ');
      return;
    }

    const seeding = this.buildSeedGroups(bracket.matches);
    if ('error' in seeding) {
      this.errorMessage = seeding.error;
      return;
    }
    const totalTeams = seeding.groups.reduce(
      (sum, group) => sum + group.teamIds.length,
      0,
    );
    if (totalTeams < 2) {
      this.errorMessage = 'At least 2 participating teams are required.';
      return;
    }

    const renumber = (slot: BracketSlotFlex): BracketSlotFlex =>
      slot.type === 'seed' || slot.type === 'bye'
        ? { type: slot.type, seed: seeding.remap.get(slot.seed)! }
        : slot;
    const payload = toBracketPayload({
      sections: bracket.sections,
      matches: bracket.matches.map((m) => ({
        ...m,
        a: renumber(m.a),
        b: renumber(m.b),
      })),
    });

    const randomGroups = seeding.groups.filter(
      (g) => g.method === 'certified-random',
    );
    const summary = seeding.groups
      .map(
        (group) =>
          `  • ${group.label}: ${group.teamIds.length} teams, ` +
          `${group.method === 'certified-random' ? 'random seeding' : 'organizer order'}`,
      )
      .join('\n');
    const confirmation =
      `Save this bracket?\n\n${summary}\n\n` +
      (randomGroups.length
        ? 'Random sections are seeded by DraftZone, exactly once — there is ' +
          'no re-roll, and every randomization of this stage is permanently ' +
          'recorded.'
        : 'The bracket will be labeled as seeded by the organizers.');
    if (!confirm(confirmation)) return;

    this.isSaving = true;
    this.manageService
      .generateBracket(this.stageId, {
        seedGroups: seeding.groups,
        rounds: payload.rounds,
        sections: payload.sections,
        matches: payload.matches,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.loadBracket();
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage =
            err?.error?.message ?? 'Failed to save the bracket.';
        },
      });
  }

  deleteBracket(): void {
    if (!this.stageId || !this.hasBracket) return;
    const certified = this.bracket?.seeding?.method === 'certified-random';
    const confirmation = certified
      ? 'Delete this bracket?\n\nThe certified seeding record is permanent: ' +
        'if you re-randomize, the bracket will publicly show it was seeded ' +
        `${(this.bracket?.seeding?.timesSeeded ?? 0) + 1} times.`
      : 'Delete this bracket and all its matchups?';
    if (!confirm(confirmation)) return;

    this.manageService.deleteBracket(this.stageId).subscribe(() => {
      this.bracket = null;
      this.sections = [];
      this.pushToCanvas({ matches: [], sections: [] });
      this.loadBracket();
    });
  }
}
