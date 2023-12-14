import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Draft } from '../team';
import { SpriteService } from '../core/sprite.service';
import { CoreModule } from '../core/core.module';
import { SpriteComponent } from '../sprite/sprite.component';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../server.service';
import { RouterModule } from '@angular/router';
import { TeamPreviewComponent } from '../team-preview/team-preview.component';


@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, TeamPreviewComponent],
  templateUrl: './draft-overview.component.html'
})
export class DraftOverviewComponent implements OnInit{
  teams!: Draft[];
  
  users = {}
  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) {
  }
  
  ngOnInit() {
    let teamid = this.route.snapshot.paramMap.get("teamid");
    console.log(teamid)
    this.serverServices.getLeagues().subscribe(data => {
      this.teams = <Draft[]>data;
    });
    
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
