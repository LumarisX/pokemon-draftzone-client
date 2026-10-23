import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { MenuAlign, MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';

@Component({
  selector: 'pdz-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, MenuComponent, MenuTriggerDirective],
  template: `
    <pdz-menu role="dialog" [align]="align()" [aria-label]="label()">
      <button
        pdz-button
        pdz-menu-trigger
        type="button"
        variant="ghost"
        color="neutral"
        size="xs"
        icon="help"
        iconOnly
        [attr.aria-label]="'About ' + label()"
      ></button>
      <div class="pdz-help__panel">
        <p class="pdz-help__title">{{ label() }}</p>
        @for (paragraph of paragraphs(); track $index) {
          <p class="pdz-help__text">{{ paragraph }}</p>
        }
        <ng-content />
      </div>
    </pdz-menu>
  `,
  styleUrl: './help.component.scss',
  host: { class: 'pdz-help' },
})
export class HelpComponent {
  readonly label = input.required<string>();
  readonly text = input<string | readonly string[] | null | undefined>(null);
  readonly align = input<MenuAlign>('start');

  protected readonly paragraphs = computed(() => {
    const text = this.text();
    if (!text) return [];
    return typeof text === 'string' ? [text] : text;
  });
}
