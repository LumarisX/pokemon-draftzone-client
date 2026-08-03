import { Component, computed, inject, input } from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PlannerLayoutService } from '../planner-layout.service';

/**
 * Card shell for a planner widget: header with a collapse toggle, projected
 * `[widget-options]` controls, and a body.
 *
 * Callers must guard their own body content on `collapsed()` so a collapsed
 * widget stops rendering — content projected through `<ng-content>` is still
 * instantiated by the parent view even when this shell hides it.
 */
@Component({
  selector: 'pdz-planner-widget',
  templateUrl: './planner-widget.component.html',
  styleUrl: './planner-widget.component.scss',
  imports: [IconComponent],
})
export class PlannerWidgetComponent {
  readonly widgetId = input.required<string>();
  readonly label = input.required<string>();

  /**
   * Stretch the card to its host width. Widgets default to sizing to their
   * content (charts, tables); form-like widgets want the full column instead.
   */
  readonly fill = input(false);

  private readonly layout = inject(PlannerLayoutService);

  readonly collapsed = computed(() => this.layout.isCollapsed(this.widgetId()));

  toggle(): void {
    this.layout.toggle(this.widgetId());
  }
}
