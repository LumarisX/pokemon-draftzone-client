import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServerService } from '../api/server.service';
import { CoreModule } from '../sprite/sprite.module';
import { SpriteService } from '../sprite/sprite.service';
import { Draft } from '../draft';
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
    this.serverServices.getDraftsList().subscribe(data => {
      this.teams = <Draft[]>data;
    });
    
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
