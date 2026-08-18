import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

export type CardTone = 'lowest' | 'low' | 'default' | 'high';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'pdz-card',
  template: `
    <ng-content select="[pdz-card-header]" />
    <div class="pdz-card__body">
      <ng-content select=":not([pdz-card-header]):not([pdz-card-footer])" />
    </div>
    <ng-content select="[pdz-card-footer]" />
  `,
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-card',
    '[attr.data-tone]': 'tone()',
    '[attr.data-padding]': 'padding()',
    '[class.pdz-card--interactive]': 'interactive()',
    '[class.pdz-card--elevated]': 'elevated()',
  },
})
export class CardComponent {
  tone = input<CardTone>('low');
  padding = input<CardPadding>('md');
  interactive = input(false, { transform: booleanAttribute });
  elevated = input(false, { transform: booleanAttribute });
}
