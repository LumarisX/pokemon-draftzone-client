import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  index = 0;
  draft?: Draft;
  matchups?: (Opponent & {
    deleteConfirm?: boolean;
    score?: [number, number] | null;
    logo?: null; //TODO: add later
  })[];
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

  constructor(
    private draftService: DraftService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamid') ?? '';
    this.reload();
  }

  reload() {
    this.draft = undefined;
    this.matchups = undefined;
    this.teamStats.next(null);
    this.draftService.getDraft(this.teamId).subscribe((data) => {
      this.draft = data;
    });
    this.draftService.getMatchupList(this.teamId).subscribe((data) => {
      this.matchups = data;
    });

    this.draftService.getStats(this.teamId).subscribe((data) => {
      this.teamStats.next(data);
    });
  }

  deleteMatchup(matchupId: string) {
    this.draftService.deleteMatchup(matchupId).subscribe(
      (response) => {
        this.reload();
        console.log('Success!', response);
      },
      (error) => console.error('Error!', error),
    );
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
      if (a == null) return 1;
      if (b == null) return -1;
      return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b) * (isAsc ? 1 : -1)
        : (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    };
    this.teamStats.next(
      this.teamStats.value?.sort((a, b) => {
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
      }) ?? null,
    );
  }
}
