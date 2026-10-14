import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { PageSectionsComponent } from '@pdz/shared/layout/page-sections/page-sections.component';

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

export type PageDensity = 'comfortable' | 'compact';

const PAGE_DENSITIES: Record<PageType, PageDensity> = {
  hub: 'comfortable',
  index: 'compact',
  detail: 'comfortable',
  workspace: 'compact',
  tool: 'compact',
  form: 'comfortable',
  dashboard: 'compact',
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
    '[attr.data-density]': 'resolvedDensity()',
    '[attr.data-flush]': 'inShell || flush() ? "" : null',
    '[attr.data-section-nav]': 'hasSectionNav() ? "" : null',
  },
})
export class PageComponent {
  readonly type = input.required<PageType>();
  readonly density = input<PageDensity>();
  readonly flush = input(false, { transform: booleanAttribute });

  protected readonly inShell = inject(PAGE_SHELL, { optional: true }) !== null;

  private readonly sectionNav = contentChild(PageSectionsComponent, {
    descendants: true,
  });

  readonly hasSectionNav = computed(
    () => this.sectionNav()?.hasNav() ?? false,
  );

  readonly width = computed(() => PAGE_WIDTHS[this.type()]);
  readonly resolvedDensity = computed(
    () => this.density() ?? PAGE_DENSITIES[this.type()],
  );
  readonly compactHeader = computed(() => COMPACT_HEADER.has(this.type()));
}
