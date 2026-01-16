import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';
import { LeagueRulesComponent } from './league-rules/league-rules.component';

@Component({
  selector: 'pdz-league-rules-overview',
  imports: [LeagueRulesComponent, RouterModule],
  templateUrl: './league-rules-overview.component.html',
  styleUrls: ['./league-rules-overview.component.scss'],
})
export class LeagueRulesOverviewComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private destroy$ = new Subject<void>();

  rules: League.Rule[] = [];

  ngOnInit(): void {
    const leagueKey = this.leagueZoneService.leagueKey();
    if (leagueKey) {
      this.leagueZoneService
        .getRules(leagueKey)
        .pipe(takeUntil(this.destroy$))
        .subscribe((ruleCategories) => {
          this.rules = this.transformRules(ruleCategories);
        });
    }
  }

  private transformRules(categories: League.RuleCategory[]): League.Rule[] {
    return categories.map((category) => ({
      title: category.header,
      body: category.details.map((detail) => `- ${detail}`).join('\n'),
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
