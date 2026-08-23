import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import {
  GeneratedBracket,
  fullRoundRobinCycle,
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  offsetBracket,
  validateBracketWiring,
} from '../league-bracket/bracket-generator';
import { BracketTeamFlex } from '../league-bracket/bracket.model';
import { TournamentBracket } from '../league-bracket/tournament-bracket.model';
import { LeagueManageService } from '../league-manage/league-manage.service';
import { LeagueZoneService } from '../league-zone.service';
import {
  savedMatchIds,
  toBuilderDraft,
  toUpdatePayload,
} from './stage-builder.adapter';
import { StageBuilderComponent } from './stage-builder.component';
import {
  BuilderDraft,
  BuilderStage,
  BuilderStageType,
  padRounds,
} from './stage-builder.model';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';

type StageFormat = 'single-elim' | 'double-elim' | 'round-robin' | 'blank';

const FORMAT_LABELS: Record<StageFormat, string> = {
  'single-elim': 'Single Elimination',
  'double-elim': 'Double Elimination',
  'round-robin': 'Round Robin',
  blank: 'Blank (build by hand)',
};

const FORMAT_STAGE_TYPES: Record<StageFormat, BuilderStageType> = {
  'single-elim': 'single-elimination',
  'double-elim': 'double-elimination',
  'round-robin': 'round-robin',
  blank: 'custom',
};

interface TeamOption {
  id: string;
  teamName: string;
  coachName: string;
  logo?: string;
  draft: { draftSlug: string; name: string } | null;
}

@Component({
  selector: 'pdz-stage-builder-page',
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    LoadingComponent,
    StageBuilderComponent,
    SelectComponent,
    SelectOptionComponent,
    ChoiceDirective,
  ],
  templateUrl: './stage-builder-page.component.html',
  styleUrl: './stage-builder-page.component.scss',
})
export class LeagueScheduleComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly manageService = inject(LeagueManageService);

  protected readonly formatLabels = FORMAT_LABELS;
  protected readonly formats = Object.keys(FORMAT_LABELS) as StageFormat[];

  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  statusMessage: string | null = null;

  bracket: TournamentBracket | null = null;
  draft: BuilderDraft = { rounds: [], stages: [], matches: [] };
  teams: TeamOption[] = [];

  private saved = new Set<string>();

  formOpen = false;
  formName = '';
  formFormat: StageFormat = 'round-robin';
  formRandom = true;
  formPublic = false;
  formRounds = 1;
  private formRoundsTouched = false;
  formGrandFinalsReset = true;
  formTeamRows: { team: TeamOption; selected: boolean }[] = [];
  formStartRound = 0;

  get hasBracket(): boolean {
    return (this.bracket?.matches?.length ?? 0) > 0;
  }

  get seededStages(): {
    name: string;
    method: string;
    seededAt: string;
    timesSeeded: number;
  }[] {
    return (this.bracket?.stages ?? [])
      .filter((stage) => stage.seeding)
      .map((stage) => ({
        name: stage.name,
        method: stage.seeding!.method,
        seededAt: stage.seeding!.seededAt,
        timesSeeded: stage.seeding!.timesSeeded,
      }));
  }

  get teamsByStage(): Map<string, BracketTeamFlex[]> {
    const byStage = new Map<string, BracketTeamFlex[]>();
    for (const stage of this.bracket?.stages ?? []) {
      byStage.set(
        stage._id,
        stage.teams.map((team) => ({
          seed: team.seed,
          teamName: team.teamName,
          coachName: team.coachName,
          logo: team.logo,
          teamId: team.teamId,
        })),
      );
    }

    const byId = new Map(this.teams.map((team) => [team.id, team]));
    for (const stage of this.draft.stages) {
      if (byStage.has(stage.key)) continue;
      const seeded: BracketTeamFlex[] = [];
      stage.teamIds.forEach((teamId, index) => {
        const team = byId.get(teamId);
        if (!team) return;
        seeded.push({
          seed: index + 1,
          teamName: team.teamName,
          coachName: team.coachName,
          logo: team.logo,
          teamId: team.id,
        });
      });
      byStage.set(stage.key, seeded);
    }
    return byStage;
  }

  ngOnInit(): void {
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

    this.load();
  }

  private load(): void {
    this.manageService.getTournamentBracket().subscribe({
      next: (bracket) => {
        this.bracket = bracket;
        this.saved = savedMatchIds(bracket);
        this.draft = toBuilderDraft(bracket);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onDraftChange(draft: BuilderDraft): void {
    this.draft = draft;
    this.statusMessage = null;
  }

  get stageCountByTeam(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const stage of this.draft.stages) {
      for (const teamId of stage.teamIds)
        counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
    }
    return counts;
  }

  openForm(startRound = 0): void {
    this.formOpen = true;
    this.formStartRound = startRound;
    this.formName = '';
    this.formRandom = true;
    this.formPublic = false;
    this.formRoundsTouched = false;
    this.formGrandFinalsReset = true;
    this.resetFormTeams();
  }

  closeForm(): void {
    this.formOpen = false;
  }

  private resetFormTeams(): void {
    const placed = this.stageCountByTeam;
    this.formTeamRows = this.teams.map((team) => ({
      team,
      selected: !placed.has(team.id),
    }));
    this.syncDefaultRounds();
  }

  setFormFormat(format: string): void {
    this.formFormat = format as StageFormat;
    this.syncDefaultRounds();
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

  get formSelectedIds(): string[] {
    return this.formTeamRows.filter((r) => r.selected).map((r) => r.team.id);
  }

  get canAddStage(): boolean {
    if (!this.formName.trim()) return false;
    return this.formFormat === 'blank' || this.formSelectedIds.length >= 2;
  }

  addStage(): void {
    if (!this.canAddStage) return;
    this.errorMessage = null;

    const teamIds = this.formSelectedIds;
    const name = this.formName.trim();
    const prefix = this.uniqueStageKey(name);
    const roundOffset = Math.max(0, this.formStartRound);

    const block = offsetBracket(
      this.generateFor(this.formFormat, teamIds.length),
      {
        prefix,

        seedOffset: 0,
        roundOffset,
        title: name,
        orderBase: this.draft.stages.length,
      },
    );

    const entryKey = this.entryBlockKey(block);
    const stages: BuilderStage[] = block.sections.map((section, index) => ({
      key: section.key,
      name: block.sections.length > 1 ? `${name} — ${section.key}` : name,
      type: FORMAT_STAGE_TYPES[this.formFormat],
      teamIds,
      public: this.formPublic,
      random: section.key === entryKey ? this.formRandom : false,
      order: section.order ?? this.draft.stages.length + index,
      ...(section.roundTitles ? { roundTitles: section.roundTitles } : {}),
    }));

    this.draft = padRounds({
      rounds: this.draft.rounds,
      stages: [...this.draft.stages, ...stages],
      matches: [...this.draft.matches, ...block.matches],
    });
    this.formOpen = false;
  }

  private entryBlockKey(block: GeneratedBracket): string | undefined {
    for (const match of block.matches) {
      for (const slot of [match.a, match.b]) {
        if (slot.type === 'seed' || slot.type === 'bye')
          return match.section ?? 'main';
      }
    }
    return block.sections[0]?.key;
  }

  private generateFor(
    format: StageFormat,
    teamCount: number,
  ): GeneratedBracket {
    switch (format) {
      case 'double-elim':
        return generateDoubleElimination(teamCount, {
          grandFinalsReset: this.formGrandFinalsReset,
        });
      case 'round-robin':
        return generateRoundRobin(teamCount, this.formRounds);
      case 'single-elim':
        return generateSingleElimination(teamCount);
      case 'blank':
        return {
          matches: [],
          sections: [{ key: 'main', kind: 'main', teamCount }],
        };
    }
  }

  private uniqueStageKey(name: string): string {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'stage';
    let unique = base;
    let n = 2;
    while (
      this.draft.stages.some(
        (s) => s.key === unique || s.key.startsWith(`${unique}--`),
      )
    )
      unique = `${base}-${n++}`;
    return unique;
  }

  save(): void {
    if (this.isSaving) return;
    this.errorMessage = null;
    this.statusMessage = null;

    if (this.draft.matches.length === 0) {
      this.errorMessage = 'Add at least one stage with matches.';
      return;
    }
    const errors = validateBracketWiring(
      this.draft.matches,

      this.draft.stages.map((stage) => ({
        key: stage.key,
        kind:
          stage.type === 'round-robin' || stage.type === 'swiss'
            ? ('round-robin' as const)
            : ('main' as const),
        teamCount: stage.teamIds.length,
      })),
    );
    if (errors.length > 0) {
      this.errorMessage = errors.join(' ');
      return;
    }

    const unseeded = this.draft.stages.filter(
      (stage) =>
        stage.teamIds.length < 2 &&
        this.draft.matches.some(
          (m) =>
            (m.section ?? 'main') === stage.key &&
            (m.a.type === 'seed' || m.b.type === 'seed'),
        ),
    );
    if (unseeded.length > 0) {
      this.errorMessage = `${unseeded.map((s) => s.name).join(', ')} needs at least 2 teams.`;
      return;
    }

    const payload = toUpdatePayload(this.draft, this.saved);

    const randomStages = this.draft.stages.filter(
      (stage) => stage.random && !stage.seeded && stage.teamIds.length > 0,
    );
    if (randomStages.length > 0) {
      const summary = randomStages
        .map((s) => `  • ${s.name}: ${s.teamIds.length} teams, random seeding`)
        .join('\n');
      if (
        !confirm(
          `Save this bracket?\n\n${summary}\n\nRandom stages are seeded by ` +
            'DraftZone, exactly once — there is no re-roll, and every ' +
            'randomization is permanently recorded.',
        )
      ) {
        return;
      }
    }

    this.isSaving = true;
    this.manageService.updateTournamentBracket(payload).subscribe({
      next: (result) => {
        this.isSaving = false;
        this.statusMessage = result.message;
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage =
          err?.error?.details?.reasons?.join(' ') ??
          err?.error?.message ??
          'Failed to save the bracket.';
      },
    });
  }

  clearBracket(): void {
    if (!this.hasBracket || this.isSaving) return;
    const certified = (this.bracket?.stages ?? []).some(
      (stage) => stage.seeding?.method === 'certified-random',
    );
    const confirmation = certified
      ? 'Delete every match in this tournament?\n\nThe certified seeding ' +
        'record is permanent: if you re-randomize, the stage will publicly ' +
        'show it was seeded more than once.'
      : 'Delete every match in this tournament?';
    if (!confirm(confirmation)) return;

    this.isSaving = true;
    this.manageService
      .updateTournamentBracket({
        rounds: this.draft.rounds.map((round) => ({
          ...(round.id ? { _id: round.id } : {}),
          name: round.name,
        })),
        stages: [],
        matches: [],
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.load();
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage =
            err?.error?.details?.reason ??
            err?.error?.message ??
            'Failed to clear the bracket.';
        },
      });
  }
}
