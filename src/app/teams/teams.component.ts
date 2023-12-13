import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../team';
import { SpriteService } from '../core/sprite.service';
import { CoreModule } from '../core/core.module';
import { SpriteComponent } from '../sprite/sprite.component';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, CoreModule, SpriteComponent],
  templateUrl: './teams.component.html'
})
export class TeamsComponent implements OnInit{
  @Input() teams!: Team[];
  
  users = {}
  constructor(private spriteService: SpriteService, private route: ActivatedRoute) {
  }
  
  ngOnInit() {
    let userId = this.route.snapshot.paramMap.get("userid");
    
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
