import { Component, input } from '@angular/core';

/**
 * Card shell for a planner widget: header with a label, projected
 * `[widget-options]` controls, and a body.
 */
@Component({
  selector: 'pdz-planner-widget',
  templateUrl: './planner-widget.component.html',
  styleUrl: './planner-widget.component.scss',
  imports: [],
})
export class PlannerWidgetComponent {
  readonly label = input.required<string>();

  /**
   * Stretch the card to its host width. Widgets default to sizing to their
   * content (charts, tables); form-like widgets want the full column instead.
   */
  readonly fill = input(false);
}
