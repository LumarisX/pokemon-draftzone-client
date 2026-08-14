import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { StageBuilderComponent } from '../league-stage-builder/stage-builder.component';
import { toBuilderDraft } from '../league-stage-builder/stage-builder.adapter';
import { BuilderDraft } from '../league-stage-builder/stage-builder.model';
import { LeagueZoneService } from '../league-zone.service';
import { BracketTeamFlex } from './bracket.model';

@Component({
  selector: 'pdz-league-bracket',
  imports: [CommonModule, IconComponent, LoadingComponent, StageBuilderComponent],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
})
export class LeagueBracketComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);

  isLoading = true;
  draft: BuilderDraft = { rounds: [], stages: [], matches: [] };
  teamsByStage = new Map<string, BracketTeamFlex[]>();
  currentRoundIndex = -1;

  get hasBracket(): boolean {
    return this.draft.matches.length > 0;
  }

  get currentRoundName(): string | null {
    return this.draft.rounds[this.currentRoundIndex]?.name ?? null;
  }

  get playedCount(): number {
    return this.draft.matches.filter((match) => match.winner !== undefined)
      .length;
  }

  readonly matchupLinkBase = computed(() => {
    const league = this.leagueService.leagueSlug();
    const tournament = this.leagueService.tournamentSlug();
    if (!league || !tournament) return null;
    return ['/leagues', league, 'tournaments', tournament];
  });

  ngOnInit(): void {
    this.leagueService.getTournamentBracket().subscribe((bracket) => {
      this.draft = toBuilderDraft(bracket);
      this.currentRoundIndex = bracket.currentRoundIndex ?? -1;
      this.teamsByStage = new Map(
        (bracket.stages ?? []).map((stage) => [
          stage._id,
          stage.teams
            .slice()
            .sort((a, b) => a.seed - b.seed)
            .map((team) => ({
              seed: team.seed,
              teamName: team.teamName,
              coachName: team.coachName,
              logo: team.logo,
              teamId: team.teamId,
              teamSlug: team.teamSlug,
            })),
        ]),
      );
      this.isLoading = false;
    });
  }
}
