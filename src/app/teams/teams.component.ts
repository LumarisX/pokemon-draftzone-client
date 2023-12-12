import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../team';
import { SpriteService } from '../core/sprite.service';
import { CoreModule } from '../core/core.module';
import { SpriteComponent } from '../sprite/sprite.component';


@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, CoreModule, SpriteComponent],
  templateUrl: './teams.component.html'
})
export class TeamsComponent {
  @Input() teams!: Team[];
  
  users = {}
  constructor(private spriteService: SpriteService) {
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
