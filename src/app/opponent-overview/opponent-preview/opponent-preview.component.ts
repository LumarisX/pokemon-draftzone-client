import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Matchup } from '../../interfaces/matchup';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { Draft } from '../../interfaces/draft';

@Component({
  selector: 'opponent-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
  templateUrl: './opponent-preview.component.html',
})
export class OpponentTeamPreviewComponent implements OnInit {
  index = 0;
  @Output() reload = new EventEmitter<boolean>();
  draft!: Draft;
  matchups!: Matchup[];
  teamId: string = '';
  deleteConfirm: boolean = false;

  constructor(
    private draftService: DraftService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.teamId = <string>this.route.snapshot.paramMap.get('teamid');
    console.log(this.teamId);
    this.draftService.getDraft(this.teamId).subscribe((data) => {
      this.draft = <Draft>data;
    });
    this.draftService.getMatchups(this.teamId).subscribe((data) => {
      this.matchups = <Matchup[]>data;
    });
  }

  //fix depreciated
  deleteMatchup(matchupId: string) {
    this.draftService.deleteMatchup(matchupId).subscribe(
      (response) => {
        console.log('Success!', response);
        this.reload.emit(true);
      },
      (error) => console.error('Error!', error)
    );
  }

  score(a: number[]) {
    let s: string;
    if (a.length == 0) {
      s = '0 - 0';
    } else {
      s = `${a[0]}  - ${a[1]}`;
    }
    return s;
  }
}
