import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

export type PageType =
  | 'hub'
  | 'index'
  | 'detail'
  | 'workspace'
  | 'tool'
  | 'form'
  | 'dashboard';

export type PageWidth = 'narrow' | 'default' | 'wide' | 'full';

const PAGE_WIDTHS: Record<PageType, PageWidth> = {
  hub: 'default',
  index: 'wide',
  detail: 'default',
  workspace: 'full',
  tool: 'default',
  form: 'narrow',
  dashboard: 'wide',
};

const COMPACT_HEADER: ReadonlySet<PageType> = new Set(['index', 'workspace']);

export const PAGE_SHELL = new InjectionToken<true>('PAGE_SHELL');

@Component({
  selector: 'pdz-page',
  template: `<div class="pdz-page__inner"><ng-content /></div>`,
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-type]': 'type()',
    '[attr.data-width]': 'width()',
    '[attr.data-flush]': 'inShell || flush() ? "" : null',
  },
})
export class PageComponent {
  readonly type = input.required<PageType>();
  readonly flush = input(false, { transform: booleanAttribute });

  protected readonly inShell = inject(PAGE_SHELL, { optional: true }) !== null;

  readonly width = computed(() => PAGE_WIDTHS[this.type()]);
  readonly compactHeader = computed(() => COMPACT_HEADER.has(this.type()));
}
