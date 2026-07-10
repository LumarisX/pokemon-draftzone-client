import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import {
  GeneratedBracket,
  fullRoundRobinCycle,
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  toBracketPayload,
  validateBracketWiring,
} from '../../league-bracket/bracket-generator';
import {
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
}

export type BracketPreset = 'single-elim' | 'double-elim' | 'round-robin';

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

  isLoading = true;
  isGenerating = false;
  errorMessage: string | null = null;

  stage: League.StageSummary | null = null;
  bracket: BracketWithSeeding | null = null;

  teams: TeamOption[] = [];

  seedingMethod: 'certified-random' | 'manual' = 'certified-random';
  grandFinalsReset = true;

  preset: BracketPreset = 'single-elim';
  roundRobinRounds = 1;
  private roundRobinRoundsTouched = false;

  builderTeams: BracketTeamFlex[] = [];

  templateMatches: FlexBracketMatch[] | undefined;
  templateSections: FlexBracketSectionConfig[] | undefined;

  get hasBracket(): boolean {
    return (this.bracket?.matches?.length ?? 0) > 0;
  }

  get stageId(): string | null {
    return this.leagueService.stageId();
  }

  get supportsGeneration(): boolean {
    return (
      this.stage?.type === 'single-elimination' ||
      this.stage?.type === 'double-elimination'
    );
  }

  get isCustomStage(): boolean {
    return this.stage?.type === 'custom';
  }

  ngOnInit(): void {
    const stageId = this.stageId;
    if (!stageId) return;

    this.leagueService.listStages().subscribe((stages) => {
      this.stage = stages.find((s) => s._id === stageId) ?? null;
      if (this.stage?.type === 'double-elimination') {
        this.preset = 'double-elim';
      }
      this.maybeInitTemplate();
    });

    this.loadBracket();

    this.leagueService.getTournamentTeams().subscribe(({ teams }) => {
      this.teams = teams.filter((t) => t.status === 'approved');
      this.updateBuilderTeams();
      this.maybeInitTemplate();
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

  moveTeam(index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= this.teams.length) return;
    const reordered = [...this.teams];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    this.teams = reordered;
    this.updateBuilderTeams();
  }

  setCertifiedRandom(checked: boolean): void {
    this.seedingMethod = checked ? 'certified-random' : 'manual';
  }

  setGrandFinalsReset(value: boolean): void {
    this.grandFinalsReset = value;
  }

  setPreset(preset: BracketPreset): void {
    this.preset = preset;
  }

  setRoundRobinRounds(value: string): void {
    const rounds = Math.floor(Number(value));
    if (!Number.isFinite(rounds) || rounds < 1) return;
    this.roundRobinRounds = rounds;
    this.roundRobinRoundsTouched = true;
  }

  private maybeInitTemplate(): void {
    if (!this.supportsGeneration || this.templateMatches) return;
    if (this.teams.length < 2) return;
    this.applyTemplate();
  }

  private applyTemplate(): void {
    const teamCount = this.teams.length;
    const generated =
      this.preset === 'double-elim'
        ? generateDoubleElimination(teamCount, {
            grandFinalsReset: this.grandFinalsReset,
          })
        : this.preset === 'round-robin'
          ? generateRoundRobin(teamCount, this.roundRobinRounds)
          : generateSingleElimination(teamCount);
    this.templateMatches = generated.matches;
    this.templateSections = generated.sections;
  }

  loadPreset(): void {
    if (this.teams.length < 2) return;

    if (
      !confirm(
        'Load this preset into the builder? Any matchups you added, moved, or rewired will be discarded.',
      )
    )
      return;
    this.applyTemplate();
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
      this.loadBracket();
    });
  }

  // ─── Bracket builder ───────────────────────────────────────────────────────

  private updateBuilderTeams(): void {
    if (!this.roundRobinRoundsTouched && this.teams.length >= 2) {
      this.roundRobinRounds = fullRoundRobinCycle(this.teams.length);
    }
    this.builderTeams = this.teams.map((team, idx) => ({
      seed: idx + 1,
      teamName: team.teamName,
      coachName: team.coachName,
      logo: team.logo,
      teamId: team.id,
    }));
  }

  /** Seeding method actually used at save: custom stages are always organizer-seeded. */
  private get effectiveSeedingMethod(): 'certified-random' | 'manual' {
    return this.isCustomStage ? 'manual' : this.seedingMethod;
  }

  saveBracket(bracket: GeneratedBracket): void {
    if (!this.stageId || this.isGenerating) return;
    this.errorMessage = null;

    if (this.teams.length < 2) {
      this.errorMessage = 'At least 2 teams are required.';
      return;
    }
    if (bracket.matches.length === 0) {
      this.errorMessage = 'Add at least one match.';
      return;
    }
    const errors = validateBracketWiring(bracket.matches);
    if (errors.length > 0) {
      this.errorMessage = errors.join(' ');
      return;
    }
    const confirmation =
      this.effectiveSeedingMethod === 'certified-random'
        ? 'Save this bracket with certified random seeding?\n\n' +
          'Seeds are assigned by DraftZone, exactly once — there is no re-roll, ' +
          'and every randomization of this stage is permanently recorded.'
        : 'Save this bracket with the seed order shown?\n\n' +
          'The bracket will be labeled as seeded by the organizers.';
    if (!confirm(confirmation)) return;

    const payload = toBracketPayload(bracket);

    this.isGenerating = true;
    this.manageService
      .generateBracket(this.stageId, {
        seedingMethod: this.effectiveSeedingMethod,
        teamIds: this.teams.map((t) => t.id),
        rounds: payload.rounds,
        matches: payload.matches,
      })
      .subscribe({
        next: () => {
          this.isGenerating = false;
          this.loadBracket();
        },
        error: (err) => {
          this.isGenerating = false;
          this.errorMessage =
            err?.error?.message ?? 'Failed to save the bracket.';
        },
      });
  }
}
