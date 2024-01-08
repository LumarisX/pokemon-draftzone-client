import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoreModule } from '../../sprite/sprite.module';
import { SpriteService } from '../../sprite/sprite.service';
import { SpriteComponent } from '../../sprite/sprite.component';
import { Draft } from '../../interfaces/draft';


@Component({
  selector: 'draft-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
  templateUrl: './draft-preview.component.html'
})
export class DraftPreviewComponent {
  @Input() team!: Draft;

  archiveConfirm: boolean = false

  constructor(private spriteService: SpriteService) {
  }
}
