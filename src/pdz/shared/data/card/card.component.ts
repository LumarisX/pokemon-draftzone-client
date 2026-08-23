import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

export type CardTone = 'lowest' | 'low' | 'default' | 'high';
export type CardColor = 'surface' | 'primary' | 'secondary' | 'danger';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'pdz-card, button[pdz-card], a[pdz-card]',
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
    '[attr.data-color]': 'color()',
    '[attr.data-padding]': 'padding()',
    '[class.pdz-card--interactive]': 'isInteractive()',
    '[class.pdz-card--elevated]': 'elevated()',
    '[class.pdz-card--selected]': 'selected()',
    '[attr.type]': 'isButton ? "button" : null',
  },
})
export class CardComponent {
  tone = input<CardTone>('low');
  color = input<CardColor>('surface');
  padding = input<CardPadding>('md');
  interactive = input(false, { transform: booleanAttribute });
  elevated = input(false, { transform: booleanAttribute });
  selected = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef)
    .nativeElement;
  protected readonly isButton = this.element.tagName === 'BUTTON';
  private readonly isControl =
    this.isButton || this.element.tagName === 'A';

  /** A card rendered as a button or link is interactive whether or not it says so. */
  protected readonly isInteractive = computed(
    () => this.interactive() || this.isControl,
  );
}
