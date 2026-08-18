import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

@Component({
  selector: 'label[pdz-check]',
  template: `
    <ng-content />
    <span class="pdz-check__body">
      @if (label()) {
        <span class="pdz-check__label">{{ label() }}</span>
      }
      <ng-content select="[pdz-check-label]" />
      @if (description()) {
        <span class="pdz-check__description">{{ description() }}</span>
      }
    </span>
  `,
  styleUrl: './check.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-check',
    '[class.pdz-check--reverse]': 'labelBefore()',
  },
})
export class CheckComponent {
  label = input<string>();
  description = input<string>();
  labelBefore = input(false, { transform: booleanAttribute });
}
