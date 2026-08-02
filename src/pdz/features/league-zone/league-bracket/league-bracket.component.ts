import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { BracketTeamFlex } from './bracket.model';
import { toBuilderDraft } from '../league-stage-builder/stage-builder.adapter';
import { BuilderDraft } from '../league-stage-builder/stage-builder.model';
import { StageBuilderComponent } from '../league-stage-builder/stage-builder.component';
import { LeagueZoneService } from '../league-zone.service';

@Component({
  selector: 'pdz-league-bracket',
  imports: [CommonModule, LoadingComponent, StageBuilderComponent],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
})
export class LeagueBracketComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);

  isLoading = true;
  draft: BuilderDraft = { rounds: [], stages: [], matches: [] };
  teamsByStage = new Map<string, BracketTeamFlex[]>();

  get hasBracket(): boolean {
    return this.draft.matches.length > 0;
  }

  ngOnInit(): void {
    this.leagueService.getTournamentBracket().subscribe((bracket) => {
      this.draft = toBuilderDraft(bracket);
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
            })),
        ]),
      );
      this.isLoading = false;
    });
  }
}
