import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injector,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

const ENTER_CLASS = 'pdz-route-enter';

@Directive({
  selector: 'router-outlet[pdzRouteEnter]',
})
export class RouteEnterDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly outlet = inject(RouterOutlet);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor() {
    this.outlet.activateEvents
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        afterNextRender(() => this.play(), { injector: this.injector }),
      );
  }

  private play(): void {
    const host = this.el.nativeElement.nextElementSibling;
    if (!(host instanceof HTMLElement)) return;

    host.classList.remove(ENTER_CLASS);
    void host.offsetWidth;
    host.classList.add(ENTER_CLASS);
    host.addEventListener(
      'animationend',
      () => host.classList.remove(ENTER_CLASS),
      { once: true },
    );
  }
}
