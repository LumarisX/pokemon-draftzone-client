import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../team';
import { SpriteService } from '../core/sprite.service';
import { CoreModule } from '../core/core.module';
import { SpriteComponent } from '../sprite/sprite.component';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../server.service';


@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, CoreModule, SpriteComponent],
  templateUrl: './teams.component.html'
})
export class TeamsComponent implements OnInit{
  teams!: Team[];
  
  users = {}
  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) {
  }
  
  ngOnInit() {
    this.serverServices.getLeagues().subscribe(data => {
      this.teams = <Team[]>data;
    });
    let userId = this.route.snapshot.paramMap.get("userid");
    
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
