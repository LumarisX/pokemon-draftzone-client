import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { BadgeComponent } from '@pdz/shared/data/badge/badge.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TabComponent } from './tab.component';
import { PDZ_TABS } from './tabs.token';

export type TabsAlign = 'start' | 'stretch';

let nextTabsId = 0;

@Component({
  selector: 'pdz-tabs',
  imports: [NgTemplateOutlet, IconComponent, BadgeComponent],
  template: `
    <div
      class="pdz-tabs__list"
      role="tablist"
      [attr.aria-label]="label()"
      (keydown)="onKeydown($event)"
    >
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          #tabButton
          type="button"
          class="pdz-tabs__tab"
          role="tab"
          [id]="tabId(i)"
          [attr.aria-controls]="panelId(i)"
          [attr.aria-selected]="i === selectedIndex()"
          [attr.tabindex]="i === selectedIndex() ? 0 : -1"
          [disabled]="tab.disabled()"
          [class.pdz-tabs__tab--active]="i === selectedIndex()"
          (click)="select(i)"
        >
          @if (tab.icon(); as icon) {
            <pdz-icon aria-hidden="true" [name]="icon" [size]="18" />
          }
          @if (tab.labelTemplate(); as labelTemplate) {
            <ng-container [ngTemplateOutlet]="labelTemplate.template" />
          } @else {
            <span class="pdz-tabs__label">{{ tab.label() }}</span>
          }
          @if (tab.badge() !== undefined) {
            <pdz-badge tone="neutral" variant="soft" size="sm">
              {{ tab.badge() }}
            </pdz-badge>
          }
        </button>
      }
      <span #indicator class="pdz-tabs__indicator" aria-hidden="true"></span>
    </div>
    @if (activeTab(); as tab) {
      <div
        class="pdz-tabs__panel"
        role="tabpanel"
        tabindex="0"
        [id]="panelId(selectedIndex())"
        [attr.aria-labelledby]="tabId(selectedIndex())"
      >
        <ng-container [ngTemplateOutlet]="tab.content" />
      </div>
    }
  `,
  styleUrl: './tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PDZ_TABS, useExisting: forwardRef(() => TabsComponent) }],
  host: {
    class: 'pdz-tabs',
    '[attr.data-align]': 'align()',
  },
})
export class TabsComponent {
  selectedIndex = model(0);
  align = input<TabsAlign>('start');
  label = input<string>();

  private readonly id = nextTabsId++;
  private readonly projected = contentChildren(TabComponent, {
    descendants: true,
  });
  private readonly buttons =
    viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
  private readonly indicator =
    viewChild<ElementRef<HTMLElement>>('indicator');

  protected readonly tabs = computed(() =>
    this.projected().filter((tab) => tab.group === this),
  );
  protected readonly activeTab = computed(
    () => this.tabs()[this.selectedIndex()],
  );

  constructor() {
    const host: ElementRef<HTMLElement> = inject(ElementRef);
    const destroyRef = inject(DestroyRef);

    afterRenderEffect(() => {
      this.selectedIndex();
      this.tabs();
      this.moveIndicator();
    });

    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.moveIndicator());
      observer.observe(host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected tabId(index: number) {
    return `pdz-tab-${this.id}-${index}`;
  }

  protected panelId(index: number) {
    return `pdz-tabpanel-${this.id}-${index}`;
  }

  protected select(index: number) {
    if (this.tabs()[index]?.disabled()) return;
    this.selectedIndex.set(index);
    this.revealTab(index);
  }

  protected onKeydown(event: KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    let target: number | undefined;

    if (step !== undefined) {
      target = this.nextEnabled(this.selectedIndex(), step);
    } else if (event.key === 'Home') {
      target = this.nextEnabled(-1, 1);
    } else if (event.key === 'End') {
      target = this.nextEnabled(this.tabs().length, -1);
    }

    if (target === undefined) return;
    event.preventDefault();
    this.selectedIndex.set(target);
    this.buttons()[target]?.nativeElement.focus();
    this.revealTab(target);
  }

  private nextEnabled(from: number, step: number) {
    const tabs = this.tabs();
    if (!tabs.length) return undefined;
    for (let i = 1; i <= tabs.length; i++) {
      const index = (from + step * i + tabs.length * i) % tabs.length;
      if (!tabs[index].disabled()) return index;
    }
    return undefined;
  }

  private moveIndicator() {
    const element = this.buttons()[this.selectedIndex()]?.nativeElement;
    const indicator = this.indicator()?.nativeElement;
    if (!element || !indicator) return;
    indicator.style.transform = `translateX(${element.offsetLeft}px)`;
    indicator.style.width = `${element.offsetWidth}px`;
  }

  private revealTab(index: number) {
    this.buttons()[index]?.nativeElement.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }
}
