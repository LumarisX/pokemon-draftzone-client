import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Draft, OpponentDraft } from '../team';
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
  draft!: Draft;
  
  users = {}
  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) {
  }
  
  ngOnInit() {
    let teamid = <string>this.route.snapshot.paramMap.get("teamid");
    this.serverServices.getOpponents(teamid).subscribe(data => {
      console.log(data),
      this.draft = <Draft>data;
    });
    
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }
}
