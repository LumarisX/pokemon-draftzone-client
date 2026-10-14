import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

export type PageSection = { id: string; label: string; count?: number };

const JUMP_GAP = 16;
const SPY_REACH = 160;
const PIN_TIMEOUT = 1000;

@Component({
  selector: 'pdz-page-sections',
  template: `
    <div class="pdz-page-sections" [attr.data-nav]="hasNav() ? '' : null">
      <nav
        #nav
        class="pdz-page-sections__nav"
        [attr.aria-label]="heading()"
        [hidden]="!hasNav()"
      >
        <h2 class="pdz-page-sections__heading">{{ heading() }}</h2>
        <ul #list class="pdz-page-sections__list">
          @for (section of sections(); track section.id) {
            <li>
              <a
                class="pdz-page-sections__link"
                [href]="'#' + section.id"
                [attr.data-section]="section.id"
                [attr.aria-current]="active() === section.id ? 'location' : null"
                (click)="jump($event, section.id)"
              >
                <span>{{ section.label }}</span>
                @if (section.count !== undefined) {
                  <span class="pdz-page-sections__count">{{ section.count }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>
      <div class="pdz-page-sections__main">
        <div class="pdz-page-sections__header">
          <ng-content select="pdz-page-header" />
        </div>
        <div #content class="pdz-page-sections__content">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styleUrl: './page-sections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSectionsComponent {
  readonly sections = input.required<PageSection[]>();
  readonly heading = input('Sections');

  readonly hasNav = computed(() => this.sections().length > 1);

  protected readonly active = signal<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly content =
    viewChild.required<ElementRef<HTMLElement>>('content');

  private pinned = false;
  private frame = 0;
  private release = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const onScroll = () => this.schedule();
      this.zone.runOutsideAngular(() => {
        document.addEventListener('scroll', onScroll, {
          capture: true,
          passive: true,
        });
        window.addEventListener('resize', onScroll, { passive: true });
      });
      destroyRef.onDestroy(() => {
        document.removeEventListener('scroll', onScroll, { capture: true });
        window.removeEventListener('resize', onScroll);
        cancelAnimationFrame(this.frame);
        clearTimeout(this.release);
      });
      this.update();
    });

    effect(() => {
      this.sections();
      this.schedule();
    });
  }

  protected jump(event: MouseEvent, id: string): void {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();

    const scroller = this.scroller();
    const scrollerTop =
      scroller === document.scrollingElement
        ? 0
        : scroller.getBoundingClientRect().top;
    const offset =
      (this.isStrip() ? this.nav().nativeElement.offsetHeight : 0) + JUMP_GAP;
    const top =
      scroller.scrollTop +
      target.getBoundingClientRect().top -
      scrollerTop -
      offset;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    this.pin(scroller);
    this.setActive(id);
    scroller.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }

  private schedule(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => this.update());
  }

  private update(): void {
    this.frame = 0;
    if (this.pinned || !this.hasNav()) return;
    const sections = this.sections();

    const navRect = this.nav().nativeElement.getBoundingClientRect();
    const line =
      (this.isStrip() ? navRect.bottom : navRect.top) +
      Math.min(window.innerHeight / 4, SPY_REACH);

    let current = sections[0].id;
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element && element.getBoundingClientRect().top <= line) {
        current = section.id;
      }
    }

    const scroller = this.scroller();
    const atEnd =
      scroller.scrollTop > 0 &&
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
    if (atEnd) current = sections[sections.length - 1].id;

    this.setActive(current);
  }

  private setActive(id: string): void {
    if (this.active() === id) return;
    this.zone.run(() => this.active.set(id));
    if (this.isStrip()) this.reveal(id);
  }

  private reveal(id: string): void {
    const list = this.list().nativeElement;
    const link = list.querySelector<HTMLElement>(
      `[data-section="${CSS.escape(id)}"]`,
    );
    if (!link) return;
    list.scrollTo({
      left: link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2,
    });
  }

  private pin(scroller: HTMLElement): void {
    this.pinned = true;
    clearTimeout(this.release);
    const unpin = () => {
      this.pinned = false;
      clearTimeout(this.release);
    };
    const source =
      scroller === document.scrollingElement ? document : scroller;
    source.addEventListener('scrollend', unpin, { once: true });
    this.release = window.setTimeout(unpin, PIN_TIMEOUT);
  }

  private isStrip(): boolean {
    const navRect = this.nav().nativeElement.getBoundingClientRect();
    const contentRect = this.content().nativeElement.getBoundingClientRect();
    return contentRect.left < navRect.right;
  }

  private scroller(): HTMLElement {
    let element = this.host.nativeElement.parentElement;
    while (element) {
      const { overflowY } = getComputedStyle(element);
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        element.scrollHeight > element.clientHeight
      ) {
        return element;
      }
      element = element.parentElement;
    }
    return (document.scrollingElement as HTMLElement | null) ??
      document.documentElement;
  }
}
