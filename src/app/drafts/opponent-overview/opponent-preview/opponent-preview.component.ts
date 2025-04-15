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

@Component({
  selector: 'opponent-preview',
  standalone: true,
  templateUrl: './opponent-preview.component.html',
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
  ],
})
export class OpponentTeamPreviewComponent implements OnInit {
  index = 0;
  draft?: Draft;
  matchups?: (Opponent & {
    deleteConfirm?: boolean;
    score?: [number, number] | null;
  })[];
  teamId: string = '';

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
}
