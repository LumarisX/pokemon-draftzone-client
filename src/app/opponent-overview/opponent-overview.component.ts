import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SpriteComponent } from '../images/sprite.component';
import { Draft } from '../interfaces/draft';
import { OpponentTeamPreviewComponent } from './opponent-preview/opponent-preview.component';
import { DraftService } from '../api/draft.service';

@Component({
  selector: 'opponent-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OpponentTeamPreviewComponent,
    SpriteComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './opponent-overview.component.html',
})
export class OpponentOverviewComponent implements OnInit {
  draft!: Draft;
  teamId: string = '';

  constructor(
    private route: ActivatedRoute,
    private draftService: DraftService
  ) {}

  ngOnInit(): void {
    this.teamId = <string>this.route.snapshot.paramMap.get('teamid');
    this.draftService.getDraft(this.teamId).subscribe((data) => {
      this.draft = <Draft>data;
    });
  }
}
