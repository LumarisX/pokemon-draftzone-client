import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
export type BadgeVariant = 'solid' | 'soft' | 'outline';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'pdz-badge',
  template: `
    @if (!dot()) {
      @if (hasCount()) {
        {{ display() }}
      } @else {
        <ng-content />
      }
    }
  `,
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-badge',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[class.pdz-badge--dot]': 'dot()',
    '[class.pdz-badge--floating]': 'floating()',
    '[attr.role]': 'label() ? "status" : null',
    '[attr.aria-label]': 'label()',
    '[attr.aria-hidden]': 'dot() && !label() ? "true" : null',
  },
})
export class BadgeComponent {
  tone = input<BadgeTone>('danger');
  variant = input<BadgeVariant>('solid');
  size = input<BadgeSize>('md');
  dot = input(false, { transform: booleanAttribute });
  floating = input(false, { transform: booleanAttribute });
  count = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  max = input(99, { transform: numberAttribute });
  label = input<string>();

  protected hasCount = computed(() => this.count() !== undefined);
  protected display = computed(() => {
    const count = this.count() ?? 0;
    return count > this.max() ? `${this.max()}+` : `${count}`;
  });
}
