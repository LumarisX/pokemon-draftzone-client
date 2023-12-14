import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServerService } from '../api/server.service';
import { SpriteService } from '../sprite/sprite.service';
import { Draft } from '../team';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { SummeryComponent } from './summery/summery.component';
import { TypechartComponent } from './typechart/typechart.component';
import { LearnsetsComponent } from './learnsets/learnsets.component';

@Component({
  selector: 'matchup',
  standalone: true,
  imports: [CommonModule, RouterModule, SummeryComponent, TypechartComponent, LearnsetsComponent, SpeedchartComponent],
  template: `
    <a routerLink="/drafts">Back</a>
    <summery></summery>
    <typechart></typechart>
    <speedchart></speedchart>
    <learnsets></learnsets>
  `
})
export class MatchupComponent implements OnInit{

  draft!: Draft;
  
  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }


  ngOnInit() {
    let teamid = <string>this.route.snapshot.paramMap.get("teamid");
    this.serverServices.getOpponents(teamid).subscribe((data) => {
      this.draft = <Draft>data;
    });
  }
}