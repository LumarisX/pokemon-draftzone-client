import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CdkAccordionItem, CdkAccordionModule } from '@angular/cdk/accordion';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownModule } from 'ngx-markdown';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-league-rules',
  imports: [CdkAccordionModule, MarkdownModule, MatIconModule],
  templateUrl: './league-rules.component.html',
  styleUrl: './league-rules.component.scss',
  animations: [
    trigger('bodyExpansion', [
      state(
        'collapsed',
        style({ height: '0px', visibility: 'hidden', opacity: 0 }),
      ),
      state(
        'expanded',
        style({ height: '*', visibility: 'visible', opacity: 1 }),
      ),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
})
export class LeagueRulesComponent {
  @Input()
  sections: League.Rule[] = [];

  getExpansionState(item: CdkAccordionItem): 'expanded' | 'collapsed' {
    return item.expanded ? 'expanded' : 'collapsed';
  }
}
