import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  HostListener,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';

@Component({
  selector: 'pdz-league-rules-overview',
  imports: [MarkdownModule, RouterModule],
  templateUrl: './league-rules-overview.component.html',
  styleUrls: ['./league-rules-overview.component.scss'],
})
export class LeagueRulesOverviewComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private destroy$ = new Subject<void>();

  rules: League.RuleSection[] = [];
  activeSection = 0;

  ngOnInit(): void {
    this.leagueZoneService
      .getRules()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ruleSections) => {
        this.rules = ruleSections.map((section) => ({
          ...section,
          body: section.body.replace(/\t/g, '  '),
        }));
      });
  }

  scrollToSection(event: Event, index: number): void {
    event.preventDefault();
    const element = document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
