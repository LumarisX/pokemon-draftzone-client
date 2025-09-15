import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { first } from 'rxjs';
import { RuleCategory } from '../../../services/league-drafting.service';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';

@Component({
  selector: `bz-rules`,
  templateUrl: `./rules.component.html`,
  standalone: true,
  styleUrl: `./rules.component.scss`,
  imports: [
    CommonModule,
    MatButtonModule,
    MatExpansionModule,
    RouterModule,
    MarkdownModule,
  ],
})
export class BZRulesComponent implements OnInit {
  leagueService = inject(LeagueZoneService);

  leagueRules: RuleCategory[] = [];

  ngOnInit(): void {
    this.leagueService
      .getRules('pdbls2')
      .pipe(first())
      .subscribe((rules) => {
        this.leagueRules = rules;
      });
  }
}
