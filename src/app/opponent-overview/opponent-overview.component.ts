import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../api/draft.service';
import { Draft } from '../interfaces/draft';
import { Matchup } from '../interfaces/matchup';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';
import { SpriteService } from '../sprite/sprite.service';
import { OpponentFormComponent } from './opponent-form/opponent-form.component';
import { OpponentTeamPreviewComponent } from './opponent-preview/opponent-preview.component';


@Component({
  selector: 'opponent-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, OpponentTeamPreviewComponent, SpriteComponent, OpponentFormComponent, ReactiveFormsModule],
  templateUrl: './opponent-overview.component.html'
})
export class OpponentOverviewComponent implements OnInit {
  draft!: Draft;
  matchups!: Matchup[];
  teamId: string = "";
  formVisible: boolean = false;

  constructor(private spriteService: SpriteService, private route: ActivatedRoute, private fb: FormBuilder, private draftService: DraftService) { }

  ngOnInit() {
    this.teamId = <string>this.route.snapshot.paramMap.get("teamid");
    this.draftService.getDraft(this.teamId).subscribe(data => {
      this.draft = <Draft>data;
    });
    this.draftService.getMatchups(this.teamId).subscribe(data => {
      this.matchups = <Matchup[]>data;
    });
  }

  reload() {
    this.draftService.getMatchups(this.teamId).subscribe(data => {
      this.matchups = <Matchup[]>data;
    });
    this.formVisible = false;
  }

}
