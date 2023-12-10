import { Component, Input, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../team';
import { SpriteService } from '../core/sprite.service';
import { CoreModule } from '../core/core.module';
import { SpriteComponent } from '../sprite/sprite.component';
import { ServerService } from '../server.service';


@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, CoreModule, SpriteComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.css',
})
export class TeamsComponent {
  @Input() teams!: Team[];
  
  serverService: ServerService = inject(ServerService);
  users = {}
  constructor(private spriteService: SpriteService) {
    this.serverService.getUsers().subscribe(data=> console.log(data));
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
