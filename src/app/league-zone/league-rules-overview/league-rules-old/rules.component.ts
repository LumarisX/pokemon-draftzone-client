
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { first } from 'rxjs';
import {
  LeagueZoneService,
  RuleCategory,
} from '../../../services/leagues/league-zone.service';

@Component({
  selector: `pdz-league-rules`,
  templateUrl: `./rules.component.html`,
  standalone: true,
  styleUrl: `./rules.component.scss`,
  imports: [
    MatButtonModule,
    MatExpansionModule,
    RouterModule,
    MarkdownModule
],
})
export class LeagueRulesComponent implements OnInit {
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
