import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoreModule } from '../core/core.module';
import { SpriteService } from '../core/sprite.service';
import { SpriteComponent } from '../sprite/sprite.component';
import { Draft } from '../team';


@Component({
  selector: 'team-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
  templateUrl: './team-preview.component.html'
})
export class TeamPreviewComponent{
  @Input() team!: Draft;

  constructor(private spriteService: SpriteService) {
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
