import { CdkTableModule } from '@angular/cdk/table';
import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { BadgeTone } from '@pdz/shared/data/badge/badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { ScoreComponent } from '@pdz/shared/data/score/score.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import {
  SeasonMvpComponent,
  SeasonMvpStat,
} from '@pdz/shared/data/season-mvp/season-mvp.component';
import { SortHeaderComponent } from '@pdz/shared/data/sort/sort-header.component';
import { Sort, SortDirective } from '@pdz/shared/data/sort/sort.directive';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import {
  TEAM_PHOTO_SIZE,
  TeamPhotoComponent,
} from '@pdz/shared/images/team-photo/team-photo.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import { formatExactTime } from '@pdz/shared/time/timezone';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { BehaviorSubject, catchError, forkJoin, of, switchMap, take } from 'rxjs';
import { DraftService, PokemonStat } from '@pdz/features/drafts/draft-overview/draft.service';
import {
  MatchTimeDialogComponent,
  MatchTimeDialogData,
  MatchTimeDialogResult,
} from '@pdz/shared/time/match-time-dialog/match-time-dialog.component';
import { Opponent } from '../opponent.model';

type Matchup = Opponent & {
  score?: [number, number] | null;
  scoreString?: string;
  scoreTone?: BadgeTone;
  logo?: string | null;
};

@Component({
  selector: 'pdz-opponent-preview',
  templateUrl: './opponent-preview.component.html',
  styleUrl: './opponent-preview.component.scss',
  imports: [
    DecimalPipe,
    RouterModule,
    SpriteComponent,
    TeamComponent,
    TeamPhotoComponent,
    SkeletonLayoutComponent,
    IconComponent,
    SortDirective,
    SortHeaderComponent,
    CdkTableModule,
    ButtonComponent,
    ScoreComponent,
    SeasonMvpComponent,
    CardComponent,
    EmptyStateComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    CountdownComponent,
    PageComponent,
    PageHeaderComponent,
    RecordComponent,
    TooltipDirective,
  ],
})
export class OpponentTeamPreviewComponent implements OnInit {
  private readonly defaultSort: Sort = { active: 'kpg', direction: 'desc' };

  private draftService = inject(DraftService);
  private route = inject(ActivatedRoute);
  private dialogs = inject(DialogService);

  readonly backLink = ['/', DRAFT_OVERVIEW_PATH];

  readonly draft = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.draftService.getDraft(params.get('teamId') ?? ''),
      ),
    ),
  );

  index = 0;
  matchups?: Matchup[];
  teamId: string = '';
  readonly draftPath = DRAFT_OVERVIEW_PATH;
  readonly photoSize = TEAM_PHOTO_SIZE;
  teamStats = new BehaviorSubject<PokemonStat[] | null>(null);
  mvp: PokemonStat | null = null;
  mvpStatList: SeasonMvpStat[] = [];
  displayedColumns: string[] = [
    'sprite',
    'name',
    'gb',
    'dk',
    'ik',
    'deaths',
    'kdr',
    'kpg',
  ];

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') ?? '';
    this.reload();
  }

  reload() {
    this.matchups = undefined;
    this.teamStats.next(null);
    this.mvp = null;
    this.mvpStatList = [];

    forkJoin({
      matchups: this.draftService.getMatchupList(this.teamId).pipe(
        take(1),
        catchError((err) => {
          console.error('Error fetching matchups:', err);
          return of([]);
        }),
      ),
      stats: this.draftService.getStats(this.teamId).pipe(
        take(1),
        catchError((err) => {
          console.error('Error fetching stats:', err);
          return of(null);
        }),
      ),
    }).subscribe(({ matchups, stats }) => {
      if (matchups) {
        this.matchups = matchups.map((m) => {
          const score = this.calculateScore(m);
          return {
            ...m,
            score,
            scoreString: this.getScoreString(score),
            scoreTone: this.getScoreTone(score),
          };
        });
      }

      if (stats) {
        this.teamStats.next(stats.pokemon);
        this.mvp = this.pickMvp(stats.pokemon);
        this.mvpStatList = this.mvp ? this.mvpStats(this.mvp) : [];
        this.sort(this.defaultSort);
      }
    });
  }

  private pickMvp(stats: PokemonStat[]): PokemonStat | null {
    const ranked = stats
      .filter((stat) => this.knockouts(stat) > 0)
      .sort(
        (a, b) =>
          this.knockouts(b) - this.knockouts(a) ||
          a.deaths - b.deaths ||
          a.brought - b.brought,
      );
    return ranked[0] ?? null;
  }

  knockouts(stat: PokemonStat): number {
    return stat.kills + stat.indirect;
  }

  mvpLine(stat: PokemonStat): string {
    return `${stat.kills} direct · ${stat.indirect} indirect`;
  }

  private mvpStats(stat: PokemonStat): SeasonMvpStat[] {
    const teamKnockouts = (this.teamStats.value ?? []).reduce(
      (sum, entry) => sum + this.knockouts(entry),
      0,
    );
    return [
      { label: 'Games', value: stat.brought },
      { label: 'Fainted', value: stat.deaths },
      {
        label: 'KOs/Game',
        value: stat.brought ? stat.kpg.toFixed(1) : '—',
      },
      {
        label: 'Team KOs',
        value: teamKnockouts
          ? `${Math.round((this.knockouts(stat) / teamKnockouts) * 100)}%`
          : '—',
      },
    ];
  }

  restNames(team: { name: string }[]): string | null {
    const rest = team.slice(TEAM_PHOTO_SIZE);
    return rest.length ? rest.map((pokemon) => pokemon.name).join(', ') : null;
  }

  private calculateScore(matchup: Opponent): [number, number] | null {
    if (!matchup || !Array.isArray(matchup.matches)) {
      return null;
    }

    if (matchup.matches.length > 1) {
      let aScore = 0;
      let bScore = 0;
      matchup.matches.forEach((match) => {
        if (match.winner === 'a') {
          aScore++;
        } else if (match.winner === 'b') {
          bScore++;
        }
      });
      return [aScore, bScore];
    } else if (matchup.matches.length > 0) {
      const match = matchup.matches[0];
      const aScore = match.aTeam?.score ?? 0;
      const bScore = match.bTeam?.score ?? 0;
      return [aScore, bScore];
    } else {
      return null;
    }
  }

  private getScoreString(score: [number, number] | null): string {
    if (score) return `${score[0]} - ${score[1]}`;
    return `Unscored`;
  }

  private getScoreTone(score: [number, number] | null): BadgeTone {
    if (!score) return 'neutral';
    if (score[0] > score[1]) return 'success';
    if (score[0] < score[1]) return 'danger';
    return 'neutral';
  }

  draftParam(slug: string): string {
    return JSON.stringify(slug);
  }

  scheduledExact(matchup: Matchup): string | null {
    if (!matchup.scheduledDate) return null;
    const date = new Date(matchup.scheduledDate);
    if (Number.isNaN(date.getTime())) return null;
    return formatExactTime(date);
  }

  async setMatchTime(matchup: Matchup) {
    const result = await this.dialogs.open<
      MatchTimeDialogComponent,
      MatchTimeDialogResult,
      MatchTimeDialogData
    >(MatchTimeDialogComponent, {
      heading: matchup.scheduledDate ? 'Edit Match Time' : 'Set Match Time',
      subheading: `${matchup.stage} vs ${matchup.teamName}`,
      size: 'lg',
      data: {
        opponentName: matchup.teamName,
        scheduledDate: matchup.scheduledDate,
        opponentTimezone: matchup.opponentTimezone,
      },
    }).closed;

    if (!result) return;

    this.draftService
      .updateMatchupSchedule(matchup._id, this.teamId, result)
      .subscribe({
        next: () => {
          matchup.scheduledDate = result.scheduledDate;
          matchup.opponentTimezone = result.opponentTimezone ?? null;
        },
        error: (error) => console.error('Failed to save match time', error),
      });
  }

  async deleteMatchup(matchupId: string) {
    const confirmed = await this.dialogs.confirm('Delete matchup', {
      message: 'Are you sure you want to delete this matchup?',
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.draftService.deleteMatchup(matchupId, this.teamId).subscribe({
      next: () => this.reload(),
      error: (error) => console.error('Failed to delete matchup', error),
    });
  }

  private compare(
    a: number | string | null | undefined,
    b: number | string | null | undefined,
    isAsc: boolean,
  ) {
    if (a == null && b == null) return 0;
    if (a == null) return isAsc ? 1 : -1;
    if (b == null) return isAsc ? -1 : 1;

    let comparison = 0;
    if (typeof a === 'string' && typeof b === 'string') {
      comparison = a.localeCompare(b);
    } else if (typeof a === 'number' && typeof b === 'number') {
      comparison = a - b;
    } else {
      comparison = String(a).localeCompare(String(b));
    }
    return comparison * (isAsc ? 1 : -1);
  }

  sort(sort: Sort) {
    const isAsc = sort.direction === 'asc';

    if (this.teamStats.value) {
      const sortedData = [...this.teamStats.value].sort((a, b) => {
        switch (sort.active) {
          case 'name':
            return this.compare(a.pokemon.name, b.pokemon.name, isAsc);
          case 'gb':
            return this.compare(a.brought, b.brought, isAsc);
          case 'dk':
            return this.compare(a.kills, b.kills, isAsc);
          case 'ik':
            return this.compare(a.indirect, b.indirect, isAsc);
          case 'deaths':
            return this.compare(a.deaths, b.deaths, isAsc);
          case 'kdr':
            return this.compare(a.kdr, b.kdr, isAsc);
          case 'kpg':
            return this.compare(a.kpg, b.kpg, isAsc);
          default:
            return 0;
        }
      });
      this.teamStats.next(sortedData);
    }
  }

  openReplays(matchup: Matchup) {
    matchup.matches
      .filter((match) => match.replay)
      .forEach((match) => {
        window.open(match.replay, '_blank');
      });
  }

  directionUp: boolean = false;

  toggleDirection() {
    this.directionUp = !this.directionUp;
    if (!this.matchups) return;
    this.matchups = this.matchups.reverse();
  }
}
