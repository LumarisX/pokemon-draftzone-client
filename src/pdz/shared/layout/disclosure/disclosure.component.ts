import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  model,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export type DisclosureTone = 'plain' | 'panel';
export type DisclosureChevronPosition = 'start' | 'end';

let nextDisclosureId = 0;

@Component({
  selector: 'pdz-disclosure',
  imports: [IconComponent],
  template: `
    <div class="pdz-disclosure__header">
      <button
        type="button"
        class="pdz-disclosure__toggle"
        [id]="headerId"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="panelId"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <pdz-icon
          class="pdz-disclosure__chevron"
          aria-hidden="true"
          name="keyboard_arrow_right"
          [size]="18"
        />
        @if (icon(); as iconName) {
          <pdz-icon
            class="pdz-disclosure__icon"
            aria-hidden="true"
            [name]="iconName"
            [size]="18"
          />
        }
        <span class="pdz-disclosure__heading">
          @if (heading(); as text) {
            {{ text }}
          } @else {
            <ng-content select="[pdz-disclosure-heading]" />
          }
        </span>
      </button>
      <span class="pdz-disclosure__trailing">
        <ng-content select="[pdz-disclosure-trailing]" />
      </span>
    </div>

    <div
      class="pdz-disclosure__panel"
      role="region"
      [id]="panelId"
      [attr.aria-labelledby]="headerId"
      [attr.inert]="open() ? null : ''"
    >
      <div class="pdz-disclosure__panel-inner">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './disclosure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-disclosure',
    '[attr.data-tone]': 'tone()',
    '[attr.data-chevron]': 'chevronPosition()',
    '[class.pdz-disclosure--open]': 'open()',
  },
})
export class DisclosureComponent {
  open = model(false);
  heading = input<string>();
  icon = input<string>();
  tone = input<DisclosureTone>('plain');
  chevronPosition = input<DisclosureChevronPosition>('start');
  disabled = input(false, { transform: booleanAttribute });

  private readonly id = nextDisclosureId++;
  protected readonly headerId = `pdz-disclosure-header-${this.id}`;
  protected readonly panelId = `pdz-disclosure-panel-${this.id}`;

  protected toggle() {
    if (this.disabled()) return;
    this.open.update((open) => !open);
  }
}
