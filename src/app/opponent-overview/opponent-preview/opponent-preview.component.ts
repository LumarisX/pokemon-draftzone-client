import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Draft } from '../../interfaces/draft';
import { Matchup } from '../../interfaces/matchup';
import { LoadingComponent } from '../../loading/loading.component';
import { SpriteComponent } from '../../images/sprite.component';

@Component({
  selector: 'opponent-preview',
  standalone: true,
  templateUrl: './opponent-preview.component.html',
  imports: [CommonModule, RouterModule, SpriteComponent, LoadingComponent],
})
export class OpponentTeamPreviewComponent implements OnInit {
  index = 0;
  draft: Draft | null = null;
  matchups: (Matchup & { deleteConfirm: boolean })[] | null = null;
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

  score(matchup: Matchup) {
    let s: string;
    s = `${matchup.aTeam.score}  - ${matchup.bTeam.score}`;
    return s;
  }
}
