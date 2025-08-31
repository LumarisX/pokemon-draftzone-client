import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Draft } from '../../../interfaces/draft';
import { Opponent } from '../../../interfaces/opponent';
import { DraftService } from '../../../services/draft.service';
import { DraftOverviewPath } from '../../draft-overview/draft-overview-routing.module';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { BehaviorSubject } from 'rxjs';
import { Stats } from '../../draft-overview/draft-stats/draft-stats.component';
import { BooleanInput } from '@angular/cdk/coercion';

type Matchup = Opponent & {
  deleteConfirm?: boolean;
  score?: [number, number] | null;
  logo?: null; //TODO: add later
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
    CdkTableModule,
    MatSortModule,
  ],
})
export class OpponentTeamPreviewComponent implements OnInit {
  private draftService = inject(DraftService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  index = 0;
  matchups?: Matchup[];
  teamId: string = '';
  readonly draftPath = DraftOverviewPath;
  selectedMatchup: Matchup | null = null;
  deleteConfirm: Boolean = false;
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

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamid') ?? '';
    this.reload();
  }

  reload() {
    this.matchups = undefined;
    this.teamStats.next(null);
    this.draftService.getMatchupList(this.teamId).subscribe((data) => {
      this.matchups = data;
    });

    this.draftService.getStats(this.teamId).subscribe((data) => {
      this.teamStats.next(data);
    });
  }

  selectMatchup(matchup: Matchup | null) {
    this.selectedMatchup = this.selectedMatchup === matchup ? null : matchup;
    this.deleteConfirm = false;
  }

  deleteMatchup(matchupId: string) {
    this.draftService.deleteMatchup(matchupId).subscribe({
      next: (response) => {
        this.reload();
        console.log('Success!', response);
      },
      error: (error) => {
        console.error('Error!', error);
      },
    });
    this.selectedMatchup = null;
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

  newOpponent() {
    this.router.navigate(['/', DraftOverviewPath, this.teamId, 'new'], {
      queryParams: { stage: `Week ${(this.matchups?.length ?? 0) + 1}` },
    });
  }

  sort(sort: Sort) {
    const isAsc = sort.direction === 'asc';
    const compare = (
      a: number | string | null | undefined,
      b: number | string | null | undefined,
    ) => {
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
    };

    if (this.teamStats.value) {
      const sortedData = [...this.teamStats.value].sort((a, b) => {
        switch (sort.active) {
          case 'name':
            return compare(a.pokemon.name, b.pokemon.name);
          case 'gb':
            return compare(a.brought, b.brought);
          case 'dk':
            return compare(a.kills, b.kills);
          case 'ik':
            return compare(a.indirect, b.indirect);
          case 'deaths':
            return compare(a.deaths, b.deaths);
          case 'kdr':
            return compare(a.kdr, b.kdr);
          case 'kpg':
            return compare(a.kpg, b.kpg);
          default:
            return 0;
        }
      });
      this.teamStats.next(sortedData);
    }
  }
}
