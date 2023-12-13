import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../team';
import { SpriteService } from '../core/sprite.service';
import { CoreModule } from '../core/core.module';
import { SpriteComponent } from '../sprite/sprite.component';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../server.service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'opponent-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
  templateUrl: './opponent-overview.component.html'
})
export class OpponentOverviewComponent implements OnInit{
  teams!: Team[];
  
  users = {}
  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) {
  }
  
  ngOnInit() {
    let teamid = this.route.snapshot.paramMap.get("teamid");
    console.log(teamid)
    this.serverServices.getLeagues().subscribe(data => {
      this.teams = <Team[]>data;
    });
    
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
