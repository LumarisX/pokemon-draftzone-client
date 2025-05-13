import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../services/draft.service';
import { Draft } from '../../../interfaces/draft';
import { Matchup } from '../../../interfaces/matchup';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { ClockSVG } from '../../../images/svg-components/clock.component';
import { TrashSVG } from '../../../images/svg-components/trash.component';
import { PlusSVG } from '../../../images/svg-components/plus.component';
import { EditSVG } from '../../../images/svg-components/edit.component';
import { ScoreSVG } from '../../../images/svg-components/score.component';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { Opponent } from '../../../interfaces/opponent';
import { DraftOverviewPath } from '../../draft-overview/draft-overview-routing.module';
import { CdkTableModule } from '@angular/cdk/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule, Sort } from '@angular/material/sort';
import { BehaviorSubject } from 'rxjs';
import { Stats } from '../draft-stats/draft-stats.component';

@Component({
  selector: 'pdz-draft-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    ClockSVG,
    TrashSVG,
    PlusSVG,
    LoadingComponent,
    EditSVG,
    ScoreSVG,
    CdkTableModule,
    MatSortModule,
    MatButtonModule,
  ],
  templateUrl: './draft-dashboard.component.html',
  styleUrl: './draft-dashboard.component.scss',
})
export class DraftDashboardComponent implements OnInit {
  index = 0;
  draft?: Draft;
  matchups?: (Opponent & {
    deleteConfirm?: boolean;
    score?: [number, number] | null;
  })[];
  teamId: string = '';
  teamStats = new BehaviorSubject<Stats[]>([]);

  readonly draftPath = DraftOverviewPath;

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
    this.draftService.getStats(this.teamId).subscribe((data) => {
      this.teamStats.next(data);
    });
    this.reload();
  }

  reload() {
    this.draft = undefined;
    this.matchups = undefined;
    this.draftService.getDraft(this.teamId).subscribe((data) => {
      this.draft = data;
    });
    this.draftService.getMatchupList(this.teamId).subscribe((data) => {
      this.matchups = data;
      // this.matchups.forEach((matchup) => {
      //   matchup.score = this.score(matchup);
      // });
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
    if (!matchup.score) return '';
    if (matchup.score[0] > matchup.score[1]) return 'bg-scale-positive-2';
    if (matchup.score[0] < matchup.score[1]) return 'bg-scale-negative-2';
    return '';
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
      this.teamStats.value.sort((a, b) => {
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
      }),
    );
  }
}
