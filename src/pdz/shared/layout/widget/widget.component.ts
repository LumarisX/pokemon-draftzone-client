import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import { CardComponent, CardTone } from '@pdz/shared/data/card/card.component';

export type WidgetPadding = 'none' | 'md';

/**
 * `stretch` lets content fill the card. `center` keeps content at its natural
 * width and centres it — for tables and charts that look wrong stretched.
 */
export type WidgetAlign = 'stretch' | 'center';

@Component({
  selector: 'pdz-widget',
  imports: [CardComponent],
  template: `
    <pdz-card padding="none" [tone]="tone()" [elevated]="elevated()">
      <div class="pdz-widget__header">
        <span class="pdz-widget__label">{{ label() }}</span>
        <div class="pdz-widget__options">
          <ng-content select="[widget-options]" />
        </div>
      </div>
      <div class="pdz-widget__body">
        <ng-content />
      </div>
    </pdz-card>
  `,
  styleUrl: './widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-widget',
    '[class.pdz-widget--fill]': 'fill()',
    '[attr.data-padding]': 'padding()',
    '[attr.data-align]': 'align()',
  },
})
export class WidgetComponent {
  readonly label = input.required<string>();
  readonly tone = input<CardTone>('lowest');

  /** Body padding. Use `none` when the projected content manages its own. */
  readonly padding = input<WidgetPadding>('md');
  readonly align = input<WidgetAlign>('stretch');
  readonly elevated = input(false, { transform: booleanAttribute });

  /**
   * Stretch the widget to its host width. Widgets default to sizing to their
   * content (charts, tables); form-like widgets want the full column instead.
   */
  readonly fill = input(false, { transform: booleanAttribute });
}
