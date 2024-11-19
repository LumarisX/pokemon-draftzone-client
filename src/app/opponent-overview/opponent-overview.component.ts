import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../api/draft.service';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { Draft } from '../interfaces/draft';

@Component({
  selector: 'opponent-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './opponent-overview.component.html',
})
export class OpponentOverviewComponent implements OnInit {
  draft!: Draft;
  teamId: string = '';
  draftPath = DraftOverviewPath;
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
