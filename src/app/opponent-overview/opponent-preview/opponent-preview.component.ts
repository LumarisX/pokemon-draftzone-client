import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Draft } from '../../interfaces/draft';
import { Matchup } from '../../interfaces/matchup';
import { LoadingComponent } from '../../loading/loading.component';
import { SpriteComponent } from '../../images/sprite.component';
import { ClockSVG } from '../../images/svg-components/clock.component';
import { TrashSVG } from '../../images/svg-components/trash.component';
import { PlusSVG } from '../../images/svg-components/plus.component';
import { EditSVG } from '../../images/svg-components/edit.component';
import { ScoreSVG } from '../../images/svg-components/score.component';

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
  draft: Draft | null = null;
  matchups:
    | (Matchup & { deleteConfirm: boolean; score: [number, number] | null })[]
    | null = null;
  teamId: string = '';

  constructor(
    private draftService: DraftService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.teamId = <string>this.route.snapshot.paramMap.get('teamid');
    this.reload();
  }

  reload() {
    this.draft = null;
    this.matchups = null;
    this.draftService.getDraft(this.teamId).subscribe((data) => {
      this.draft = <Draft>data;
    });
    this.draftService.getMatchupList(this.teamId).subscribe((data) => {
      this.matchups = <(Matchup & { deleteConfirm: boolean })[]>data;
      this.matchups.forEach((matchup) => {
        matchup.score = this.score(matchup);
      });
    });
  }

  deleteMatchup(matchupId: string) {
    this.draftService.deleteMatchup(matchupId).subscribe(
      (response) => {
        this.reload();
        console.log('Success!', response);
      },
      (error) => console.error('Error!', error)
    );
  }

  score(matchup: Matchup): [number, number] | null {
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

  scoreString(matchup: Matchup) {
    if (matchup.score) return `${matchup.score[0]} - ${matchup.score[1]}`;
    return `Unscored`;
  }

  scoreColor(matchup: Matchup) {
    if (!matchup.score) return '';
    if (matchup.score[0] > matchup.score[1]) return 'bg-scale-positive-2';
    if (matchup.score[0] < matchup.score[1]) return 'bg-scale-negative-2';
    return '';
  }
}
