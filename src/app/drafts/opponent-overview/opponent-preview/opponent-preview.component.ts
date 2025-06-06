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

  newOpponent() {
    this.router.navigate(['/', DraftOverviewPath, this.teamId, 'new'], {
      queryParams: { stage: `Week ${(this.matchups?.length ?? 0) + 1}` },
    });
  }
}
