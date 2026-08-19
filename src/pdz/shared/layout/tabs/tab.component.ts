import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewChild,
  booleanAttribute,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { PDZ_TABS } from './tabs.token';

@Directive({ selector: '[pdzTabLabel]' })
export class TabLabelDirective {
  readonly template = inject(TemplateRef);
}

@Component({
  selector: 'pdz-tab',
  template: `<ng-template><ng-content /></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent {
  readonly group = inject(PDZ_TABS, { optional: true });

  label = input<string>();
  icon = input<string>();
  badge = input<number | string>();
  disabled = input(false, { transform: booleanAttribute });

  readonly labelTemplate = contentChild(TabLabelDirective);

  @ViewChild(TemplateRef, { static: true })
  readonly content!: TemplateRef<unknown>;
}
