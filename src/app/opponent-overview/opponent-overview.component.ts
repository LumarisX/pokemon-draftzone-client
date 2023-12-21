import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServerService } from '../api/server.service';
import { Draft } from '../draft';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';
import { SpriteService } from '../sprite/sprite.service';


@Component({
  selector: 'opponent-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent],
  templateUrl: './opponent-overview.component.html'
})
export class OpponentOverviewComponent implements OnInit{
  draft!: Draft;
  
  users = {}
  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }
  
  ngOnInit() {
    let teamid = <string>this.route.snapshot.paramMap.get("teamid");
    this.serverServices.getDraft(teamid).subscribe(data => {
      this.draft = <Draft>data;
    });
  }

  spriteDiv(name:string){
    return this.spriteService.getSprite(name);
  }

  score(a: number[]){
    let s:string
    if(a.length == 0){
      s = "0 - 0";
    } else {
      s = `${a[0]}  - ${a[1]}`
    }
    return s;
  }
}
