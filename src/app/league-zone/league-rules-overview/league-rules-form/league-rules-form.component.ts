import {
  trigger,
  state,
  animate,
  style,
  transition,
} from '@angular/animations';
import { CdkAccordionItem, CdkAccordionModule } from '@angular/cdk/accordion';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownModule } from 'ngx-markdown';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-league-rules-form',
  imports: [
    FormsModule,
    MarkdownModule,
    CdkAccordionModule,
    DragDropModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  standalone: true,
  templateUrl: './league-rules-form.component.html',
  styleUrl: './league-rules-form.component.scss',
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
export class LeagueRulesFormComponent {
  view: string = 'edit';

  @Input()
  sections: League.Rule[] = [];

  addSection() {
    this.sections.push({
      title: '',
      body: '',
    });
  }

  removeSection(index: number) {
    this.sections.splice(index, 1);
  }

  getExpansionState(item: CdkAccordionItem): 'expanded' | 'collapsed' {
    return item.expanded ? 'expanded' : 'collapsed';
  }
  onDrop(event: CdkDragDrop<League.Rule[]>) {
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
  }
}
