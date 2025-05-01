import { Component, Input } from '@angular/core';
import { CdkAccordionItem, CdkAccordionModule } from '@angular/cdk/accordion';
import { MarkdownModule } from 'ngx-markdown';
import { Section } from '../league-rules.interface';
import { MatIconModule } from '@angular/material/icon';
import {
  trigger,
  state,
  animate,
  transition,
  style,
} from '@angular/animations';

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
  sections: Section[] = [];

  getExpansionState(item: CdkAccordionItem): 'expanded' | 'collapsed' {
    return item.expanded ? 'expanded' : 'collapsed';
  }
}
