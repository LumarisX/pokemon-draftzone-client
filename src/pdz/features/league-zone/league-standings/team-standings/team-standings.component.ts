import { UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { BadgeTone } from '@pdz/shared/data/badge/badge.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { ScoreComponent } from '@pdz/shared/data/score/score.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { PlusSignPipe } from '@pdz/shared/pipes/plus-sign.pipe';
import {
  ResultBoxComponent,
  ResultBoxResult,
} from '@pdz/shared/data/result-box/result-box.component';

type ResultOutcome = League.TeamStandingData['results'][number];

const OUTCOME_LABELS: Record<NonNullable<ResultOutcome>['outcome'], string> = {
  w: 'Win',
  d: 'Draw',
  t: 'Tie',
  l: 'Loss',
  ff: 'Forfeit loss',
};

const OUTCOME_RESULTS: Record<
  NonNullable<ResultOutcome>['outcome'],
  ResultBoxResult
> = {
  w: 'win',
  d: 'draw',
  t: 'draw',
  l: 'loss',
  ff: 'loss',
};

@Component({
  selector: 'pdz-team-standings',
  imports: [
    IconComponent,
    PlusSignPipe,
    RecordComponent,
    ResultBoxComponent,
    ScoreComponent,
    TeamComponent,
    UpperCasePipe,
  ],
  templateUrl: './team-standings.component.html',
  styleUrl: './team-standings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamStandingsComponent {
  readonly standingData = input.required<League.TeamStandingsTable>();
  readonly ownTeamId = input<string | null>(null);
  readonly teamLinkBase = input<string[] | null>(null);

  protected readonly showDraws = computed(() =>
    this.standingData().teams.some((team) => (team.draws ?? 0) > 0),
  );

  protected readonly showPoints = computed(
    () =>
      this.showDraws() || (this.standingData().rules?.points.loss ?? 0) > 0,
  );

  protected logo(team: League.TeamStandingData): string | undefined {
    return getTeamLogoSrc(team.logo);
  }

  protected diffTone(diff: number): BadgeTone {
    if (diff > 0) return 'success';
    if (diff < 0) return 'danger';
    return 'neutral';
  }

  protected readonly outcomeResult = OUTCOME_RESULTS;

  protected resultLabel(result: NonNullable<ResultOutcome>): string {
    const score = result.score > 0 ? `+${result.score}` : `${result.score}`;
    return `${OUTCOME_LABELS[result.outcome]} ${score}`;
  }
}
