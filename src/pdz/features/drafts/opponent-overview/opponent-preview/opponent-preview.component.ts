import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  BadgeComponent,
  BadgeTone,
} from '@pdz/shared/data/badge/badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { BehaviorSubject, catchError, forkJoin, of, take } from 'rxjs';
import { DraftService, PokemonStat } from '../../draft-overview/draft.service';
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
    CommonModule,
    RouterModule,
    SpriteComponent,
    LoadingComponent,
    IconComponent,
    MatSortModule,
    CdkTableModule,
    ButtonComponent,
    BadgeComponent,
    CardComponent,
    EmptyStateComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
  ],
})
export class OpponentTeamPreviewComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) matSort?: MatSort;
  private readonly defaultSort: Sort = { active: 'kpg', direction: 'desc' };

  ngAfterViewInit(): void {
    if (this.matSort) {
      this.matSort.active = this.defaultSort.active;
      this.matSort.direction = this.defaultSort.direction;
    }
  }
  private draftService = inject(DraftService);
  private route = inject(ActivatedRoute);
  private dialogs = inject(DialogService);

  index = 0;
  matchups?: Matchup[];
  teamId: string = '';
  readonly draftPath = DRAFT_OVERVIEW_PATH;
  teamStats = new BehaviorSubject<PokemonStat[] | null>(null);
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
        this.sort(this.defaultSort);
      }
    });
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
