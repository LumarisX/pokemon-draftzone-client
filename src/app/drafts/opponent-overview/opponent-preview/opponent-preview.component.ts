import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BehaviorSubject, catchError, forkJoin, of, take } from 'rxjs';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Opponent } from '../../../interfaces/opponent';
import { DraftService } from '../../../services/draft.service';
import { DraftOverviewPath } from '../../draft-overview/draft-overview-routing.module';
import { Stats } from '../../draft-overview/draft-stats/draft-stats.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { CdkStepLabel } from '@angular/cdk/stepper';

type Matchup = Opponent & {
  score?: [number, number] | null;
  scoreString?: string;
  scoreClass?: string;
  logo?: string | null;
};

@Component({
  selector: 'pdz-opponent-preview',
  standalone: true,
  templateUrl: './opponent-preview.component.html',
  styleUrl: './opponent-preview.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    LoadingComponent,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatDialogModule,
    CdkTableModule,
    CdkStepLabel,
  ],
})
export class OpponentTeamPreviewComponent implements OnInit {
  private draftService = inject(DraftService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  index = 0;
  matchups?: Matchup[];
  teamId: string = '';
  readonly draftPath = DraftOverviewPath;
  teamStats = new BehaviorSubject<Stats[] | null>(null);
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

  menuState: {
    [key: string]: '' | 'main' | 'confirm-archive' | 'confirm-delete';
  } = {};

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamid') ?? '';
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
          console.log(score);
          return {
            ...m,
            score,
            scoreString: this.getScoreString(score),
            scoreClass: this.getScoreClass(score),
          };
        });
      }

      if (stats) {
        this.teamStats.next(stats);
      }
    });
  }

  score(matchup: Opponent): [number, number] | null {
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
      return [matchup.matches[0].aTeam.score, matchup.matches[0].bTeam.score];
    } else {
      return null;
    }
  }

  scoreString(matchup: Opponent) {
    if (matchup.score) return `${matchup.score[0]} - ${matchup.score[1]}`;
    return `Unscored`;
  }

  scoreColor(matchup: Opponent) {
    if (!matchup.score) return;
    if (matchup.score[0] > matchup.score[1]) return 'lightgreen';
    if (matchup.score[0] < matchup.score[1]) return 'lightcoral';
    return '';
  }

  scoreClass(matchup: Opponent) {
    if (!matchup.score) return 'pdz-background-neut';
    if (matchup.score[0] > matchup.score[1]) return 'pdz-background-pos';
    if (matchup.score[0] < matchup.score[1]) return 'pdz-background-neg';
    return 'pdz-background-neut';
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
      return [matchup.matches[0].aTeam.score, matchup.matches[0].bTeam.score];
    } else {
      return null;
    }
  }

  private getScoreString(score: [number, number] | null): string {
    if (score) return `${score[0]} - ${score[1]}`;
    return `Unscored`;
  }

  private getScoreClass(score: [number, number] | null): string {
    if (!score) return 'pdz-background-neut';
    if (score[0] > score[1]) return 'pdz-background-pos';
    if (score[0] < score[1]) return 'pdz-background-neg';
    return 'pdz-background-neut';
  }

  deleteMatchup(matchupId: string) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.draftService.deleteMatchup(matchupId).subscribe({
          next: () => {
            this.reload();
          },
          error: (error) => {
            console.error('Error!', error);
          },
        });
      }
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

  toggleMenu(leagueId: string) {
    this.menuState[leagueId] =
      this.menuState[leagueId] === 'main' ? '' : 'main';
  }

  openReplays(matchup: Matchup) {
    matchup.matches
      .filter((match) => match.replay)
      .forEach((match) => {
        window.open(match.replay, '_blank');
      });
  }
}
