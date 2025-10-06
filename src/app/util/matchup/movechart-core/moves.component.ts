import { CdkAccordionItem, CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject } from 'rxjs';
import { MoveChart } from '../../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { typeColor } from '../../styling';

@Component({
  selector: 'moves-core',
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    CdkAccordionModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SpriteComponent,
  ],
})
export class MoveCoreComponent {
  _movechart: MoveChart = [];
  @Input()
  set movechart(value: MoveChart) {
    if (!value) return;
    this._movechart = value.map((category) => ({
      ...category,
      moves: [...category.moves].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    this.updateShownMoves(false);
  }

  readonly shownMoves = new BehaviorSubject<MoveChart>([]);

  typeColor = typeColor;
  updateShownMoves(showAll: boolean) {
    this.shownMoves.next(
      showAll
        ? this._movechart
        : this._movechart.map((category) => ({
            ...category,
            moves: category.moves.filter((move) => move.pokemon.length > 0),
          })),
    );
  }

  @ViewChildren(CdkAccordionItem) panels!: QueryList<CdkAccordionItem>;

  get anyOpened() {
    return this.panels?.some((panel) => panel.expanded);
  }
  closeAll() {
    this.panels.forEach((accordian) => accordian.close());
  }
  openAll() {
    this.panels.forEach((accordian) => accordian.open());
  }
}
