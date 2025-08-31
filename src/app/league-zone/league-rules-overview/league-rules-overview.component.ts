import { Component, OnInit, inject } from '@angular/core';
import { LeagueRulesFormComponent } from './league-rules-form/league-rules-form.component';
import { LeagueRulesComponent } from './league-rules/league-rules.component';
import { LeagueZoneService } from '../../services/league-zone.service';
import { League } from '../league.interface';

@Component({
  selector: 'pdz-league-rules-overview',
  imports: [LeagueRulesFormComponent, LeagueRulesComponent],
  templateUrl: './league-rules-overview.component.html',
  styleUrl: './league-rules-overview.component.scss',
})
export class LeagueRulesOverviewComponent implements OnInit {
  private leagueZoneService = inject(LeagueZoneService);

  rules: League.Rule[] = [];

  ngOnInit(): void {
    this.leagueZoneService.getRules().subscribe((rules) => {
      this.rules = rules;
    });
  }
}
