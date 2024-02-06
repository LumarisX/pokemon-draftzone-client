import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { Matchup } from '../../interfaces/matchup';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { SpriteService } from '../../sprite/sprite.service';

@Component({
  selector: 'opponent-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
  templateUrl: './opponent-preview.component.html',
})
export class OpponentTeamPreviewComponent {
  @Input() matchup!: Matchup;
  @Input() index = 0;
  @Output() reload = new EventEmitter<boolean>();

  deleteConfirm: boolean = false;

  constructor(
    private spriteService: SpriteService,
    private draftService: DraftService
  ) {}

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
