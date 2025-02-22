import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MoveChart } from '../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { BehaviorSubject } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'planner-moves',
  standalone: true,
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    CdkAccordionModule,
    MatIconModule,
    MatTooltipModule,
    SpriteComponent,
  ],
})
export class MoveComponent {
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
}
